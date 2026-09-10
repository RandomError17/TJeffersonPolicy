/**
 * Tournament reads and writes.
 *
 * Two shapes are returned deliberately: `*ForMembers` strips officer-only
 * fields (officerNotes, other people's registrations) so a member endpoint
 * cannot leak them even if a component forgets to filter.
 */
import type { Prisma, Tournament, TournamentDivision } from "@prisma/client";
import { prisma } from "../db";
import { uniqueSlug } from "../utils/slug";

export type TournamentWithDivisions = Tournament & { divisions: TournamentDivision[] };

const memberVisibleStatuses = ["OPEN", "CLOSED"];

/** Fields a member is allowed to see. officerNotes is absent by construction. */
export const memberTournamentSelect = {
  id: true,
  name: true,
  slug: true,
  startDate: true,
  endDate: true,
  location: true,
  circuit: true,
  description: true,
  eligibility: true,
  memberNotes: true,
  registrationOpensAt: true,
  registrationDeadline: true,
  status: true,
  externalRegistrationUrl: true,
  tabroomUrl: true,
  divisions: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.TournamentSelect;

export function isRegistrationOpen(tournament: Pick<Tournament, "status" | "registrationDeadline">, now = new Date()): boolean {
  if (tournament.status !== "OPEN") return false;
  if (tournament.registrationDeadline && tournament.registrationDeadline.getTime() < now.getTime()) return false;
  return true;
}

/** Upcoming and recently closed tournaments, for the member schedule page. */
export async function listTournamentsForMembers(options: { includePast?: boolean } = {}) {
  const now = new Date();
  return prisma.tournament.findMany({
    where: {
      status: { in: memberVisibleStatuses },
      ...(options.includePast ? {} : { OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: startOfDay(now) } }] }),
    },
    select: memberTournamentSelect,
    orderBy: { startDate: options.includePast ? "desc" : "asc" },
  });
}

export async function getTournamentForMember(id: string) {
  return prisma.tournament.findFirst({
    where: { id, status: { in: memberVisibleStatuses } },
    select: memberTournamentSelect,
  });
}

export async function listTournamentsForOfficers(options: { includeArchived?: boolean } = {}) {
  return prisma.tournament.findMany({
    where: options.includeArchived ? {} : { status: { not: "ARCHIVED" } },
    include: {
      divisions: { orderBy: { sortOrder: "asc" } },
      _count: { select: { registrations: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getTournamentForOfficer(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      divisions: { orderBy: { sortOrder: "asc" } },
      registrations: {
        include: { user: true, division: true },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

export interface TournamentInput {
  name: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  circuit: string;
  description?: string;
  eligibility?: string;
  memberNotes?: string;
  officerNotes?: string;
  registrationOpensAt?: Date;
  registrationDeadline?: Date;
  status: string;
  externalRegistrationUrl?: string;
  tabroomUrl?: string;
  tabroomId?: number;
  divisions: { id?: string; name: string; code?: string; feeCents?: number; capacity?: number }[];
}

export async function createTournament(input: TournamentInput, createdById: string): Promise<TournamentWithDivisions> {
  const slug = await uniqueSlug(`${input.name}-${input.startDate.getFullYear()}`, async (candidate) =>
    Boolean(await prisma.tournament.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );

  return prisma.tournament.create({
    data: {
      ...scalarFields(input),
      slug,
      createdById,
      divisions: {
        create: input.divisions.map((division, index) => ({
          name: division.name,
          code: division.code ?? null,
          feeCents: division.feeCents ?? null,
          capacity: division.capacity ?? null,
          sortOrder: index,
        })),
      },
    },
    include: { divisions: { orderBy: { sortOrder: "asc" } } },
  });
}

/**
 * Update in a transaction. Divisions the officer removed are only deleted when
 * nothing is registered for them — otherwise the division is kept so existing
 * registrations are never silently destroyed.
 */
export async function updateTournament(
  id: string,
  input: TournamentInput,
): Promise<{ tournament: TournamentWithDivisions; keptDivisions: string[] }> {
  const keptDivisions: string[] = [];

  const tournament = await prisma.$transaction(async (tx) => {
    const existing = await tx.tournamentDivision.findMany({
      where: { tournamentId: id },
      include: { _count: { select: { registrations: true } } },
    });

    const submittedIds = new Set(input.divisions.map((d) => d.id).filter(Boolean) as string[]);

    for (const division of existing) {
      if (submittedIds.has(division.id)) continue;
      if (division._count.registrations > 0) {
        keptDivisions.push(division.name);
        continue;
      }
      await tx.tournamentDivision.delete({ where: { id: division.id } });
    }

    for (const [index, division] of input.divisions.entries()) {
      const data = {
        name: division.name,
        code: division.code ?? null,
        feeCents: division.feeCents ?? null,
        capacity: division.capacity ?? null,
        sortOrder: index,
      };
      if (division.id && existing.some((e) => e.id === division.id)) {
        await tx.tournamentDivision.update({ where: { id: division.id }, data });
      } else {
        await tx.tournamentDivision.create({ data: { ...data, tournamentId: id } });
      }
    }

    return tx.tournament.update({
      where: { id },
      data: scalarFields(input),
      include: { divisions: { orderBy: { sortOrder: "asc" } } },
    });
  });

  return { tournament, keptDivisions };
}

function scalarFields(input: TournamentInput) {
  return {
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    location: input.location,
    circuit: input.circuit,
    description: input.description ?? null,
    eligibility: input.eligibility ?? null,
    memberNotes: input.memberNotes ?? null,
    officerNotes: input.officerNotes ?? null,
    registrationOpensAt: input.registrationOpensAt ?? null,
    registrationDeadline: input.registrationDeadline ?? null,
    status: input.status,
    externalRegistrationUrl: input.externalRegistrationUrl ?? null,
    tabroomUrl: input.tabroomUrl ?? null,
    tabroomId: input.tabroomId ?? null,
  };
}

export async function archiveTournament(id: string) {
  return prisma.tournament.update({ where: { id }, data: { status: "ARCHIVED" } });
}

/**
 * Hard delete, allowed only when nothing is registered. Archiving is the
 * normal path; this exists for tournaments created by mistake.
 */
export async function deleteTournamentIfEmpty(id: string): Promise<boolean> {
  const count = await prisma.tournamentRegistration.count({ where: { tournamentId: id } });
  if (count > 0) return false;
  await prisma.tournament.delete({ where: { id } });
  return true;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
