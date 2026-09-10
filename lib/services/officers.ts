/**
 * Public officer roster.
 *
 * An officer profile is the only place a member's name and a contact address
 * are published, and it exists only when an officer has explicitly created one
 * with isPublic set — being an OFFICER does not itself put anyone on the site.
 */
import { prisma } from "../db";
import { parseStringList, serializeStringList } from "../json";
import { currentSeasonYear } from "../constants";

export async function listPublicOfficers(termYear = currentSeasonYear()) {
  const officers = await prisma.officerProfile.findMany({
    where: { isPublic: true, termYear },
    include: { user: { select: { displayName: true, gradeNumber: true, graduationYear: true } } },
    orderBy: [{ sortOrder: "asc" }, { position: "asc" }],
  });

  // Fall back to the most recent published term so the page is never blank
  // just because the season rolled over before officers were re-entered.
  if (officers.length > 0) return { officers, termYear };

  const latest = await prisma.officerProfile.findFirst({
    where: { isPublic: true },
    orderBy: { termYear: "desc" },
    select: { termYear: true },
  });
  if (!latest) return { officers: [], termYear };

  return {
    officers: await prisma.officerProfile.findMany({
      where: { isPublic: true, termYear: latest.termYear },
      include: { user: { select: { displayName: true, gradeNumber: true, graduationYear: true } } },
      orderBy: [{ sortOrder: "asc" }, { position: "asc" }],
    }),
    termYear: latest.termYear,
  };
}

export async function listOfficerProfiles() {
  return prisma.officerProfile.findMany({
    include: { user: { select: { id: true, displayName: true, role: true, gradeNumber: true } } },
    orderBy: [{ termYear: "desc" }, { sortOrder: "asc" }],
  });
}

export async function saveOfficerProfile(input: {
  userId: string;
  position: string;
  bio?: string;
  publicEmail?: string;
  photoUrl?: string;
  events: string[];
  termYear: number;
  isPublic: boolean;
  sortOrder: number;
}) {
  const data = {
    position: input.position,
    bio: input.bio ?? null,
    publicEmail: input.publicEmail ?? null,
    photoUrl: input.photoUrl ?? null,
    events: serializeStringList(input.events),
    termYear: input.termYear,
    isPublic: input.isPublic,
    sortOrder: input.sortOrder,
  };

  return prisma.$transaction(async (tx) => {
    const profile = await tx.officerProfile.upsert({
      where: { userId: input.userId },
      create: { ...data, userId: input.userId },
      update: data,
    });
    // Publishing someone as an officer grants the officer role; the two were
    // otherwise easy to leave out of sync.
    await tx.user.update({ where: { id: input.userId }, data: { role: "OFFICER" } });
    return profile;
  });
}

export async function removeOfficerProfile(userId: string, options: { demote: boolean }) {
  return prisma.$transaction(async (tx) => {
    await tx.officerProfile.deleteMany({ where: { userId } });
    if (options.demote) await tx.user.update({ where: { id: userId }, data: { role: "MEMBER" } });
  });
}

export function officerEvents(profile: { events: string }): string[] {
  return parseStringList(profile.events);
}
