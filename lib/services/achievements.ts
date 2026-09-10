/**
 * Competitive results shown on the public Achievements page.
 *
 * The table ships empty on purpose: no result is written into this codebase
 * that officers have not entered themselves, so nothing on the public site can
 * be a fabricated placement.
 */
import { prisma } from "../db";
import { parseStringList, serializeStringList } from "../json";

export async function listAchievements() {
  return prisma.achievement.findMany({ orderBy: [{ seasonYear: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] });
}

export async function listFeaturedAchievements(limit = 3) {
  return prisma.achievement.findMany({
    where: { isFeatured: true },
    orderBy: [{ seasonYear: "desc" }, { sortOrder: "asc" }],
    take: limit,
  });
}

export async function getAchievement(id: string) {
  return prisma.achievement.findUnique({ where: { id } });
}

export async function saveAchievement(input: {
  id?: string;
  title: string;
  tournamentName: string;
  seasonYear: number;
  placement: string;
  eventName?: string;
  description?: string;
  participants: string[];
  level: string;
  isFeatured: boolean;
  sortOrder: number;
}) {
  const data = {
    title: input.title,
    tournamentName: input.tournamentName,
    seasonYear: input.seasonYear,
    placement: input.placement,
    eventName: input.eventName ?? null,
    description: input.description ?? null,
    participants: serializeStringList(input.participants),
    level: input.level,
    isFeatured: input.isFeatured,
    sortOrder: input.sortOrder,
  };
  return input.id ? prisma.achievement.update({ where: { id: input.id }, data }) : prisma.achievement.create({ data });
}

export async function deleteAchievement(id: string) {
  return prisma.achievement.delete({ where: { id } });
}

export function achievementParticipants(achievement: { participants: string }): string[] {
  return parseStringList(achievement.participants);
}

export interface AchievementSeason {
  seasonYear: number;
  achievements: Awaited<ReturnType<typeof listAchievements>>;
}

/** Group by season for the timeline layout. */
export function groupBySeason(achievements: Awaited<ReturnType<typeof listAchievements>>): AchievementSeason[] {
  const map = new Map<number, typeof achievements>();
  for (const achievement of achievements) {
    const bucket = map.get(achievement.seasonYear) ?? [];
    bucket.push(achievement);
    map.set(achievement.seasonYear, bucket);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([seasonYear, items]) => ({ seasonYear, achievements: items }));
}

/** Headline counts for the public page. Derived, never hand-entered. */
export function achievementStats(achievements: { level: string; seasonYear: number }[]) {
  const seasons = new Set(achievements.map((a) => a.seasonYear));
  return {
    total: achievements.length,
    national: achievements.filter((a) => a.level === "NATIONAL").length,
    state: achievements.filter((a) => a.level === "STATE").length,
    seasons: seasons.size,
  };
}
