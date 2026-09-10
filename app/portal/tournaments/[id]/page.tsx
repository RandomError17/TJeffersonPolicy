import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge, RegistrationBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/States";
import { requireUserPage } from "@/lib/auth/guards";
import { TOURNAMENT_CIRCUITS, labelFor } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { mostRecentRegistrationDefaults } from "@/lib/services/registrations";
import { getTournamentForMember, isRegistrationOpen } from "@/lib/services/tournaments";
import { formatDateRange, formatDateTime, formatMoney, formatRelative } from "@/lib/utils/format";
import { RegisterForm, type DivisionOption } from "./RegisterForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tournament = await getTournamentForMember(id);
  return { title: tournament?.name ?? "Tournament" };
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const user = await requireUserPage("/portal/tournaments");
  const { id } = await params;

  const tournament = await getTournamentForMember(id);
  if (!tournament) notFound();

  // Own registrations only — the member query never returns other people's.
  const [myRegistrations, divisionCounts, recentDefaults] = await Promise.all([
    prisma.tournamentRegistration.findMany({
      where: { userId: user.id, tournamentId: tournament.id },
      select: { id: true, divisionId: true, status: true, partnerName: true, memberNote: true },
    }),
    prisma.tournamentRegistration.groupBy({
      by: ["divisionId"],
      where: { tournamentId: tournament.id, status: { in: ["PENDING", "REGISTERED"] } },
      _count: { _all: true },
    }),
    mostRecentRegistrationDefaults(user.id),
  ]);

  const countByDivision = new Map(divisionCounts.map((row) => [row.divisionId, row._count._all]));
  // Withdrawing deletes the row, so every fetched registration is still live.
  const liveByDivision = new Map(myRegistrations.map((r) => [r.divisionId, r]));

  const open = isRegistrationOpen(tournament);

  const options: DivisionOption[] = tournament.divisions.map((division) => ({
    id: division.id,
    name: division.name,
    code: division.code,
    feeCents: division.feeCents,
    alreadyRegistered: liveByDivision.has(division.id),
    full: division.capacity != null && (countByDivision.get(division.id) ?? 0) >= division.capacity,
  }));

  return (
    <>
      <Link href="/portal/tournaments" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All tournaments
      </Link>

      <PageHeading
        title={tournament.name}
        description={`${formatDateRange(tournament.startDate, tournament.endDate)} · ${tournament.location}`}
        actions={
          <>
            <Badge tone={open ? "good" : "neutral"}>{open ? "Registration open" : "Registration closed"}</Badge>
            {tournament.tabroomUrl ? (
              <ButtonLink href={tournament.tabroomUrl} size="sm" variant="outline" external>
                Tabroom
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardBody className="space-y-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Dates" value={formatDateRange(tournament.startDate, tournament.endDate)} />
                <Detail label="Location" value={tournament.location} />
                <Detail label="Circuit" value={labelFor(TOURNAMENT_CIRCUITS, tournament.circuit)} />
                <Detail
                  label="Registration deadline"
                  value={
                    tournament.registrationDeadline
                      ? `${formatDateTime(tournament.registrationDeadline)} (${formatRelative(tournament.registrationDeadline)})`
                      : "Not set"
                  }
                />
              </dl>

              {tournament.description ? (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60">About</h3>
                  <p className="mt-1.5 whitespace-pre-line text-base leading-relaxed text-ink/75">
                    {tournament.description}
                  </p>
                </div>
              ) : null}

              {tournament.eligibility ? (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60">Eligibility</h3>
                  <p className="mt-1.5 whitespace-pre-line text-base leading-relaxed text-ink/75">
                    {tournament.eligibility}
                  </p>
                </div>
              ) : null}

              {tournament.memberNotes ? (
                <Alert tone="info" title="Note from the officer team">
                  <span className="whitespace-pre-line">{tournament.memberNotes}</span>
                </Alert>
              ) : null}

              {tournament.externalRegistrationUrl ? (
                <ButtonLink href={tournament.externalRegistrationUrl} size="sm" variant="outline" external>
                  External registration page
                </ButtonLink>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events at this tournament</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y-2 divide-rule-faint">
                {tournament.divisions.map((division) => {
                  const mine = liveByDivision.get(division.id);
                  const entered = countByDivision.get(division.id) ?? 0;
                  return (
                    <li key={division.id} className="flex flex-wrap items-center gap-6 px-7 py-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-ink">
                          {division.name}
                          {division.code ? <span className="ml-2 text-sm font-normal text-ink/60">{division.code}</span> : null}
                        </p>
                        <p className="mt-1.5 text-sm text-ink/60">
                          {division.feeCents ? `${formatMoney(division.feeCents)} entry` : "No fee listed"}
                          {division.capacity ? ` · ${entered}/${division.capacity} spots taken` : ""}
                        </p>
                      </div>
                      {mine ? <RegistrationBadge status={mine.status} /> : null}
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{open ? "Register" : "Registration"}</CardTitle>
            </CardHeader>
            <CardBody>
              {open ? (
                <RegisterForm
                  tournamentId={tournament.id}
                  divisions={options}
                  defaults={{
                    partnerName: recentDefaults?.partnerName ?? user.partnerName ?? "",
                    schoolEmail: user.tjEmail ?? "",
                    tabroomEmail: recentDefaults?.tabroomEmail ?? "",
                    phoneNumber: recentDefaults?.phoneNumber ?? user.phoneNumber ?? "",
                    grade: user.gradeNumber,
                    partnerSchoolEmail: recentDefaults?.partnerSchoolEmail ?? "",
                  }}
                />
              ) : (
                <Alert tone="warn" title="Registration is closed">
                  {tournament.registrationDeadline
                    ? `The deadline was ${formatDateTime(tournament.registrationDeadline)}.`
                    : "Officers have closed registration for this tournament."}{" "}
                  Ask an officer if you still want to be considered.
                </Alert>
              )}
            </CardBody>
          </Card>

          {myRegistrations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Your entries here</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                <ul className="divide-y-2 divide-rule-faint">
                  {myRegistrations.map((registration) => {
                    const division = tournament.divisions.find((d) => d.id === registration.divisionId);
                    return (
                      <li key={registration.id} className="px-7 py-5">
                        <div className="flex items-center justify-between gap-6">
                          <p className="text-base font-semibold text-ink">{division?.name ?? "Event"}</p>
                          <RegistrationBadge status={registration.status} />
                        </div>
                        {registration.partnerName ? (
                          <p className="mt-1 text-sm text-ink/60">Partner: {registration.partnerName}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t-2 border-rule-faint px-7 py-5">
                  <Link href="/portal/registrations" className="text-sm font-semibold text-navy-600 hover:text-navy-500">
                    Manage registrations →
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
