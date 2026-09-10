/**
 * What a member owes.
 *
 * There is no ledger to keep in sync: a member's balance is the fees of the
 * tournament divisions they registered for, plus the price of the items they
 * ordered, minus whatever an officer has checked off as paid on their profile
 * (see the "Balance" section on the member detail page). Mark everything
 * paid and the amount owed is $0 — there is no separate "settle the season"
 * action, because there is nothing left to settle once every item is checked.
 *
 * The one thing this file still lets an officer set directly is a season
 * waiver: an explicit excuse from paying at all, for a hardship case. That is
 * the only place a "status" is actually stored; everywhere else, Paid /
 * Pending / Unpaid is a label derived from the itemized data.
 */
import { prisma } from "../db";
import { currentSeasonYear } from "../constants";

/** Registration/order states that represent a real commitment to pay. */
const OWED_STATUSES = ["PENDING", "REGISTERED"] as const;

function seasonWindow(seasonYear: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(seasonYear, 7, 1)), // August 1
    end: new Date(Date.UTC(seasonYear + 1, 6, 31, 23, 59, 59, 999)), // July 31
  };
}

export type DuesStatusLabel = "WAIVED" | "PAID" | "PENDING" | "UNPAID";

function deriveStatus(waived: boolean, totalCents: number, owedCents: number): DuesStatusLabel {
  if (waived) return "WAIVED";
  if (totalCents === 0 || owedCents === 0) return "PAID";
  if (owedCents < totalCents) return "PENDING";
  return "UNPAID";
}

interface FeeBearingRegistration {
  divisionId: string;
  feePaid: boolean;
  division: { feeCents: number | null };
}
interface FeeBearingOrder {
  quantity: number;
  paid: boolean;
  item: { priceCents: number | null };
}

/** Sum of fees regardless of paid status. Waitlisted entries are excluded — nothing is owed until a spot is real. */
function totalOf(registrations: FeeBearingRegistration[], orders: FeeBearingOrder[]): number {
  const registrationTotal = registrations.reduce((sum, r) => sum + (r.division.feeCents ?? 0), 0);
  const orderTotal = orders.reduce((sum, o) => sum + (o.item.priceCents ?? 0) * o.quantity, 0);
  return registrationTotal + orderTotal;
}

/** Sum of fees not yet checked off as paid. */
function owedOf(registrations: FeeBearingRegistration[], orders: FeeBearingOrder[]): number {
  const registrationOwed = registrations.filter((r) => !r.feePaid).reduce((sum, r) => sum + (r.division.feeCents ?? 0), 0);
  const orderOwed = orders.filter((o) => !o.paid).reduce((sum, o) => sum + (o.item.priceCents ?? 0) * o.quantity, 0);
  return registrationOwed + orderOwed;
}

/** A member's balance for one season: what they owe, and what that comes from. */
export interface MemberSeasonBalance {
  seasonYear: number;
  totalCents: number;
  owedCents: number;
  waived: boolean;
  note: string | null;
  updatedAt: Date | null;
  status: DuesStatusLabel;
}

async function seasonBalance(userId: string, seasonYear: number): Promise<MemberSeasonBalance> {
  const { start, end } = seasonWindow(seasonYear);

  const [registrations, orders, waiver] = await Promise.all([
    prisma.tournamentRegistration.findMany({
      where: { userId, status: { in: [...OWED_STATUSES] }, tournament: { startDate: { gte: start, lte: end } } },
      select: { divisionId: true, feePaid: true, division: { select: { feeCents: true } } },
    }),
    prisma.order.findMany({
      where: { userId, status: { in: [...OWED_STATUSES] }, createdAt: { gte: start, lte: end } },
      select: { quantity: true, paid: true, item: { select: { priceCents: true } } },
    }),
    prisma.duesRecord.findUnique({
      where: { userId_seasonYear: { userId, seasonYear } },
      select: { waived: true, note: true, updatedAt: true },
    }),
  ]);

  const totalCents = totalOf(registrations, orders);
  const owedCents = waiver?.waived ? 0 : owedOf(registrations, orders);

  return {
    seasonYear,
    totalCents,
    owedCents,
    waived: waiver?.waived ?? false,
    note: waiver?.note ?? null,
    updatedAt: waiver?.updatedAt ?? null,
    status: deriveStatus(waiver?.waived ?? false, totalCents, owedCents),
  };
}

/** The member-facing view: this season's balance. */
export async function getOwnDues(userId: string, seasonYear = currentSeasonYear()): Promise<MemberSeasonBalance> {
  return seasonBalance(userId, seasonYear);
}

/**
 * What a member still owes for the current season, itemised — shown on their
 * dues page so "you owe $75" comes with "for what."
 */
export async function listOwnUnpaidItems(userId: string, seasonYear = currentSeasonYear()) {
  const { start, end } = seasonWindow(seasonYear);

  const [registrations, orders] = await Promise.all([
    prisma.tournamentRegistration.findMany({
      where: {
        userId,
        feePaid: false,
        status: { in: [...OWED_STATUSES] },
        tournament: { startDate: { gte: start, lte: end } },
        division: { feeCents: { not: null } },
      },
      select: { id: true, tournament: { select: { name: true } }, division: { select: { name: true, feeCents: true } } },
    }),
    prisma.order.findMany({
      where: {
        userId,
        paid: false,
        status: { in: [...OWED_STATUSES] },
        createdAt: { gte: start, lte: end },
        item: { priceCents: { not: null } },
      },
      select: { id: true, quantity: true, item: { select: { name: true, priceCents: true } } },
    }),
  ]);

  return [
    ...registrations.map((r) => ({
      key: `registration-${r.id}`,
      label: `${r.tournament.name} — ${r.division.name}`,
      amountCents: r.division.feeCents ?? 0,
    })),
    ...orders.map((o) => ({
      key: `order-${o.id}`,
      label: o.quantity > 1 ? `${o.quantity} × ${o.item.name}` : o.item.name,
      amountCents: (o.item.priceCents ?? 0) * o.quantity,
    })),
  ];
}

/** Every season the member has activity or a waiver in, most recent first. */
export async function listOwnDuesHistory(userId: string): Promise<MemberSeasonBalance[]> {
  const [registrationYears, orderYears, waiverYears] = await Promise.all([
    prisma.tournamentRegistration.findMany({ where: { userId }, select: { tournament: { select: { startDate: true } } } }),
    prisma.order.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.duesRecord.findMany({ where: { userId }, select: { seasonYear: true } }),
  ]);

  const seasonOf = (date: Date) => (date.getUTCMonth() >= 7 ? date.getUTCFullYear() : date.getUTCFullYear() - 1);

  const seasons = new Set<number>([
    ...registrationYears.map((r) => seasonOf(r.tournament.startDate)),
    ...orderYears.map((o) => seasonOf(o.createdAt)),
    ...waiverYears.map((w) => w.seasonYear),
  ]);

  const sorted = [...seasons].sort((a, b) => b - a);
  return Promise.all(sorted.map((year) => seasonBalance(userId, year)));
}

/**
 * Excuse a member from dues for a season, or undo that. This is the only
 * thing about a member's balance an officer sets directly rather than by
 * checking off individual items.
 */
export async function setDuesWaiver(input: {
  userId: string;
  seasonYear: number;
  waived: boolean;
  note?: string;
  updatedById: string;
}) {
  return prisma.duesRecord.upsert({
    where: { userId_seasonYear: { userId: input.userId, seasonYear: input.seasonYear } },
    create: {
      userId: input.userId,
      seasonYear: input.seasonYear,
      waived: input.waived,
      note: input.note ?? null,
      updatedById: input.updatedById,
    },
    update: { waived: input.waived, note: input.note ?? null, updatedById: input.updatedById },
    include: { user: { select: { displayName: true } } },
  });
}

/** Roster-level view for the officer dues page: everyone's balance for a season. */
export async function duesOverview(seasonYear = currentSeasonYear()) {
  const activeMembers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, displayName: true, gradeNumber: true },
    orderBy: { lastName: "asc" },
  });

  const balances = await Promise.all(activeMembers.map((member) => seasonBalance(member.id, seasonYear)));

  const rows = activeMembers
    .map((user, index) => ({ user, balance: balances[index] }))
    .sort((a, b) => a.balance.status.localeCompare(b.balance.status) || a.user.displayName.localeCompare(b.user.displayName));

  const totals = {
    paid: rows.filter((r) => r.balance.status === "PAID").length,
    pending: rows.filter((r) => r.balance.status === "PENDING").length,
    waived: rows.filter((r) => r.balance.status === "WAIVED").length,
    unpaid: rows.filter((r) => r.balance.status === "UNPAID").length,
    outstandingCents: rows.reduce((sum, r) => sum + r.balance.owedCents, 0),
  };

  return { rows, totals, seasonYear };
}
