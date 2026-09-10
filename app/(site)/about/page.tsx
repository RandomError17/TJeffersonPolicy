import type { Metadata } from "next";
import Image from "next/image";
import { PageHero, Section, SectionHeading } from "@/components/site/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CLUB, EXTERNAL_LINKS, MEETINGS, SEASON_PHASES } from "@/lib/content/club";

export const metadata: Metadata = {
  title: "About",
  description:
    "Policy Debate at Thomas Jefferson High School for Science and Technology — how the program is organised, how meetings run, and what a season looks like.",
};

const VALUES = [
  {
    title: "Research first",
    body: "Every argument is grounded in evidence cut from journals, government reporting, and the trade press. Debaters build files they can defend under cross-examination.",
  },
  {
    title: "Student-led",
    body: "Captains and teaching coordinators run practice, write the novice curriculum, and coach rounds. The officer team is elected from within the squad.",
  },
  {
    title: "Open to beginners",
    body: "The novice squad assumes no experience. Fundamentals, drills, and lectures run all year, and novices compete at their own level from the first tournament.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About the program"
        title="A research program that happens to be a debate team"
        description="Policy Debate has been part of extracurricular life at Thomas Jefferson for decades. Today the team fields varsity and novice squads across the local, state, and national circuits."
        index="01"
      />

      <Section tone="raised">
        <div className="u-grid-12 items-start">
          <Reveal className="col-span-12 lg:col-span-7">
            <SectionHeading eyebrow="The program" title="How the team works" />
            <div className="mt-10 space-y-6 border-l-4 border-navy-600 pl-8">
              <p className="t-body-lg t-muted">
                Policy is a two-person event. Partners debate a single national resolution for the entire school year,
                arguing the affirmative in some rounds and the negative in others, which means every debater has to
                understand the topic from both directions.
              </p>
              <p className="t-body t-muted">
                Preparation happens in two places: weekly eighth-period meetings, where the squad drills speeches and
                runs practice rounds, and independent research, where partnerships build and update their own files
                between tournaments.
              </p>
              <p className="t-body t-muted">
                Officers coordinate tournament entries, run the novice curriculum, and manage the team&rsquo;s finances
                and logistics. Competing is a real commitment — most tournaments run a full Saturday, and some run two
                days.
              </p>
            </div>
            <div className="mt-12 flex flex-wrap gap-4">
              <ButtonLink href="/join" variant="solid">
                How to join
              </ButtonLink>
              <ButtonLink href={EXTERNAL_LINKS.constitutionPdf} variant="outline" external>
                Read the constitution (PDF)
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={120} className="col-span-12 lg:col-span-5">
            <figure className="c-frame">
              <Image
                src="/brand/team.jpg"
                alt="Members of the TJ Policy Debate team with trophies and plaques after a tournament."
                width={1600}
                height={1041}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="h-auto w-full"
              />
              <figcaption className="border-t-2 border-rule bg-navy-800 px-6 py-5 text-sm leading-relaxed text-white/70">
                The squad after a tournament. Photograph from the team&rsquo;s own archive.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Section>

      <Section tone="paper">
        <SectionHeading eyebrow="What we care about" title="Three things that define the squad" />
        {/* Cells sit on a navy bed showing through 1px gaps, so the reveal has
            to animate the contents — fading the cell itself would expose the
            bed underneath it. */}
        <ul className="mt-16 grid gap-px border-2 border-rule bg-rule md:grid-cols-3">
          {VALUES.map((value, index) => (
            <li key={value.title} className="bg-paper-raised">
              <Reveal delay={index * 90} className="flex h-full flex-col p-10">
                <span className="c-numeral" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="t-h3 mt-10 text-ink">{value.title}</h3>
                <p className="t-body t-muted mt-5">{value.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="raised">
        <div className="u-grid-12">
          <div className="col-span-12 lg:col-span-6">
            <SectionHeading eyebrow="Meetings" title="Where to find us" />
            <ul className="mt-12 space-y-6">
              {MEETINGS.map((meeting) => (
                <li key={meeting.squad} className="c-frame p-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <h3 className="t-h3 text-ink">{meeting.squad} squad</h3>
                    <span className="bg-navy-600 px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.14em] text-white">
                      {meeting.when}
                    </span>
                  </div>
                  <p className="t-body t-muted mt-5">{meeting.detail}</p>
                  <a
                    href={meeting.ionActivityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex items-center gap-2 border-b-2 border-signal pb-1 font-display text-sm font-bold uppercase tracking-[0.14em] text-navy-600 transition-colors hover:bg-signal hover:text-ink"
                  >
                    Activity page on Ion <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <SectionHeading eyebrow="Calendar" title="The shape of a season" />
            <ol className="mt-12 border-l-4 border-navy-600 pl-8">
              {SEASON_PHASES.map((phase, index) => (
                <li key={phase.window} className="relative pb-10 last:pb-0">
                  <span
                    className="absolute -left-[42px] top-1 flex h-6 w-6 items-center justify-center bg-signal font-display text-[11px] font-extrabold text-ink"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <p className="font-display text-lg font-bold uppercase tracking-tight text-ink">{phase.window}</p>
                  <p className="t-body t-muted mt-2">{phase.detail}</p>
                </li>
              ))}
            </ol>
            <p className="t-body t-muted mt-10 border-t-2 border-rule-faint pt-6">
              Exact dates change each year. Signed-in members see the live tournament calendar and register directly in
              the team portal.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="navy" tight>
        <div className="u-grid-12 items-center">
          <div className="col-span-12 lg:col-span-7">
            <p className="c-label">Get in touch</p>
            <h2 className="t-h2 mt-8 text-white">Questions about the team?</h2>
            <p className="t-body-lg mt-8 max-w-xl text-white/70">
              Officers answer questions from prospective members, current debaters, and parents. Reach the team at{" "}
              <a
                href={`mailto:${CLUB.email}`}
                className="border-b-2 border-signal font-semibold text-white hover:bg-signal hover:text-ink"
              >
                {CLUB.email}
              </a>
              .
            </p>
          </div>
          <div className="col-span-12 flex flex-wrap gap-4 lg:col-span-5 lg:justify-end">
            <ButtonLink href="/officers" variant="primary" size="lg">
              Meet the officers
            </ButtonLink>
            <ButtonLink href="/contact" variant="onDark" size="lg">
              Contact the team
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
