/**
 * Officer dashboard metrics.
 *
 * All counts are derived from the database at read time — nothing here is a
 * stored or hand-maintained figure.
 */
import { prisma } from "../db";
import { currentSeasonYear } from "../constants";
import { duesOverview } from "./dues";

export async function dashboardSummary(seasonYear = currentSeasonYear()) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalMembers,
    activeMembers,
    officers,
    upcomingTournaments,
    openTournaments,
    pendingRegistrations,
    dues,
    recentOrders,
    draftNews,
    resources,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "OFFICER" } }),
    prisma.tournament.count({ where: { startDate: { gte: startOfToday }, status: { in: ["OPEN", "CLOSED"] } } }),
    prisma.tournament.count({ where: { status: "OPEN" } }),
    prisma.tournamentRegistration.count({ where: { status: "PENDING" } }),
    duesOverview(seasonYear),
    prisma.order.count({ where: { status: { in: ["PENDING", "WAITLISTED"] } } }),
    prisma.newsPost.count({ where: { status: "DRAFT" } }),
    prisma.resource.count(),
  ]);

  return {
    seasonYear,
    totalMembers,
    activeMembers,
    officers,
    upcomingTournaments,
    openTournaments,
    pendingRegistrations,
    duesPaid: dues.totals.paid + dues.totals.waived,
    duesUnsettled: dues.totals.unpaid + dues.totals.pending,
    outstandingCents: dues.totals.outstandingCents,
    openOrders: recentOrders,
    draftNews,
    resources,
  };
}

export async function recentActivity(limit = 8) {
  const [registrations, orders, news, audit] = await Promise.all([
    prisma.tournamentRegistration.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { displayName: true } }, tournament: { select: { name: true } }, division: { select: { name: true } } },
    }),
    prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { displayName: true } }, item: { select: { name: true } } },
    }),
    prisma.newsPost.findMany({ take: 5, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, status: true, updatedAt: true, slug: true } }),
    prisma.auditLog.findMany({ take: limit, orderBy: { createdAt: "desc" } }),
  ]);

  return { registrations, orders, news, audit };
}

/** Participation and roster breakdowns for the analytics page. */
export async function participationAnalytics(seasonYear = currentSeasonYear()) {
  const seasonStart = new Date(Date.UTC(seasonYear, 7, 1));
  const seasonEnd = new Date(Date.UTC(seasonYear + 1, 6, 31, 23, 59, 59));

  const [byGrade, byStatus, registrations, tournaments, topEntrants] = await Promise.all([
    prisma.user.groupBy({ by: ["gradeNumber"], _count: { _all: true }, where: { status: "ACTIVE" } }),
    prisma.tournamentRegistration.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.tournamentRegistration.count({ where: { tournament: { startDate: { gte: seasonStart, lte: seasonEnd } } } }),
    prisma.tournament.findMany({
      where: { startDate: { gte: seasonStart, lte: seasonEnd }, status: { not: "ARCHIVED" } },
      select: { id: true, name: true, startDate: true, _count: { select: { registrations: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.tournamentRegistration.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: { status: { in: ["PENDING", "REGISTERED"] } },
      orderBy: { _count: { userId: "desc" } },
      take: 8,
    }),
  ]);

  const names = await prisma.user.findMany({
    where: { id: { in: topEntrants.map((entry) => entry.userId) } },
    select: { id: true, displayName: true },
  });
  const nameById = new Map(names.map((n) => [n.id, n.displayName]));

  return {
    seasonYear,
    byGrade: byGrade
      .map((row) => ({ grade: row.gradeNumber, count: row._count._all }))
      .sort((a, b) => (a.grade ?? 99) - (b.grade ?? 99)),
    byRegistrationStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
    seasonRegistrations: registrations,
    tournaments: tournaments.map((t) => ({ id: t.id, name: t.name, startDate: t.startDate, entries: t._count.registrations })),
    topEntrants: topEntrants.map((entry) => ({
      name: nameById.get(entry.userId) ?? "Unknown",
      entries: entry._count._all,
    })),
  };
}
