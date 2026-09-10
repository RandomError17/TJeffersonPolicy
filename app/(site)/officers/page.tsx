import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/PageHero";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { DEBATE_EVENTS, labelFor, seasonLabel } from "@/lib/constants";
import { OFFICER_ROSTER_2025 } from "@/lib/content/club";
import { listPublicOfficers, officerEvents } from "@/lib/services/officers";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = {
  title: "Officer team",
  description: "The elected officer team leading TJ Policy Debate — captains, teaching coordinators, and staff roles.",
};

/**
 * The roster is database-driven. Until officers create their profiles in the
 * dashboard, the page falls back to the roster carried over from the previous
 * site so it is never blank and never shows invented people. Once any profile
 * exists for a term, the database is the only source.
 */
export default async function OfficersPage() {
  const [{ officers, termYear }, settings] = await Promise.all([listPublicOfficers(), getSettings()]);
  const usingFallback = officers.length === 0;

  return (
    <>
      <PageHero
        eyebrow={usingFallback ? "Officer team" : `Officer team · ${seasonLabel(termYear)}`}
        title="The people running the team"
        description="Officers are elected from within the squad. They coach rounds, write the novice curriculum, run tournament logistics, and keep the club going."
        index="02"
      />

      <Section tone="raised">
        {usingFallback ? (
          <ul className="grid gap-px border-2 border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {OFFICER_ROSTER_2025.map((officer, index) => (
              <li key={officer.email} className="bg-paper-raised">
                <Reveal delay={index * 70} as="article" className="flex h-full flex-col p-9">
                  <Avatar name={officer.name} size="xl" />
                  <h2 className="t-h3 mt-8 text-ink">{officer.name}</h2>
                  <p className="mt-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-navy-600">
                    {officer.position}
                  </p>
                  <a
                    href={`mailto:${officer.email}`}
                    className="mt-auto pt-8 text-sm text-ink/70 underline decoration-signal decoration-2 underline-offset-4 transition-colors hover:bg-signal hover:text-ink"
                  >
                    {officer.email}
                  </a>
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-px border-2 border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {officers.map((officer, index) => {
              const events = officerEvents(officer);
              return (
                <li key={officer.id} className="bg-paper-raised">
                  <Reveal delay={index * 70} as="article" className="flex h-full flex-col p-9">
                    <Avatar name={officer.user.displayName} photoUrl={officer.photoUrl} size="xl" />
                    <h2 className="t-h3 mt-8 text-ink">{officer.user.displayName}</h2>
                    <p className="mt-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-navy-600">
                      {officer.position}
                    </p>
                    {officer.user.gradeNumber ? (
                      <p className="mt-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink/50">
                        Grade {officer.user.gradeNumber}
                      </p>
                    ) : null}
                    {officer.bio ? <p className="t-body t-muted mt-6">{officer.bio}</p> : null}
                    {events.length > 0 ? (
                      <ul className="mt-6 flex flex-wrap gap-2">
                        {events.map((event) => (
                          <li
                            key={event}
                            className="border-2 border-rule px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink"
                          >
                            {labelFor(DEBATE_EVENTS, event)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {officer.publicEmail ? (
                      <a
                        href={`mailto:${officer.publicEmail}`}
                        className="mt-auto pt-8 text-sm text-ink/70 underline decoration-signal decoration-2 underline-offset-4 transition-colors hover:bg-signal hover:text-ink"
                      >
                        {officer.publicEmail}
                      </a>
                    ) : null}
                  </Reveal>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section tone="navy" tight>
        <div className="u-grid-12 items-center">
          <div className="col-span-12 lg:col-span-7">
            <p className="c-label">One address</p>
            <h2 className="t-h2 mt-8 text-white">Not sure who to ask?</h2>
            <p className="t-body-lg mt-8 max-w-xl text-white/70">
              Anything addressed to{" "}
              <a
                href={`mailto:${settings["club.email"]}`}
                className="border-b-2 border-signal font-semibold text-white hover:bg-signal hover:text-ink"
              >
                {settings["club.email"]}
              </a>{" "}
              reaches the whole officer team.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:flex lg:justify-end">
            <ButtonLink href="/contact" variant="primary" size="lg">
              All the ways to reach us
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
