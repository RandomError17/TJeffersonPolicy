import type { Metadata } from "next";
import { PageHero, Section, SectionHeading } from "@/components/site/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { JOIN_STEPS, MEETINGS, POLICY_EXPLAINER } from "@/lib/content/club";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = {
  title: "Join the team",
  description:
    "How to join TJ Policy Debate — what Policy Debate is, what the commitment looks like, and the five steps to your first tournament.",
};

const FAQ = [
  {
    q: "Do I need any experience?",
    a: "No. The novice squad starts from the beginning every year — what a speech is, how to flow, how evidence works. Most of the varsity squad started as novices here.",
  },
  {
    q: "How much time does it take?",
    a: "One eighth-period block a week, plus tournaments. Most tournaments are a single Saturday; a few of the larger ones run Friday evening through Sunday. How much research you do between tournaments is up to you and your partner.",
  },
  {
    q: "Do I need a partner right away?",
    a: "No. Come to a meeting first. If you do not have a partner, tell an officer and they will pair you up.",
  },
  {
    q: "Does it cost anything?",
    a: "There are club dues for the season and, for some tournaments, an entry fee. Payment goes through MySchoolBucks, and your status is tracked in the team portal once you sign in. Talk to the treasurer if cost is a barrier — it should not stop anyone from competing.",
  },
  {
    q: "Can I join partway through the year?",
    a: "Yes. Novices join throughout the season. The earlier you start the more tournaments you get, but there is no cutoff.",
  },
] as const;

const PORTAL_FEATURES = [
  { title: "Tournament registration", body: "Open entries, deadlines, and your own registration history." },
  { title: "Dues & orders", body: "What you owe, what you have paid, and where apparel orders stand." },
  { title: "Resource library", body: "Evidence, case files, and guides the officer team maintains." },
  { title: "Your record", body: "Awards and past entries in one place." },
] as const;

export default async function JoinPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHero
        eyebrow="Join the team"
        title="Start here"
        description="Five steps from curious to competing. No experience needed, and novices join all year."
      >
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="#steps" variant="primary" size="lg">
            See the steps
          </ButtonLink>
          <ButtonLink href={MEETINGS[1].ionActivityUrl} variant="onDark" size="lg" external>
            Novice activity on Ion
          </ButtonLink>
        </div>
      </PageHero>

      {/* Understand the activity before committing to it. */}
      <Section tone="raised">
        <SectionHeading
          eyebrow="First, what is it?"
          title="Policy Debate in four points"
          description="If you have only done public forum or LD — or nothing at all — this is what makes Policy different."
        />
        <ul className="mt-16 grid gap-px border-2 border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {POLICY_EXPLAINER.map((card, index) => (
            <li key={card.title} className="bg-paper-raised">
              <Reveal delay={index * 70} className="h-full p-9">
                <span className="font-display text-sm font-extrabold tabular-nums tracking-[0.1em] text-signal-deep">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="t-h3 mt-6 text-ink">{card.title}</h3>
                <p className="t-body t-muted mt-5">{card.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* Steps */}
      <Section tone="paper" id="steps">
        <SectionHeading eyebrow="The path in" title="Five steps to your first tournament" />

        <ol className="mt-16 border-t-2 border-rule">
          {JOIN_STEPS.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 70}>
              <div className="group grid gap-8 border-b-2 border-rule py-10 transition-colors hover:bg-paper-sunk md:grid-cols-[8rem_minmax(0,1fr)] md:gap-12">
                <span className="c-numeral block" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="min-w-0 md:pt-2">
                  <h3 className="t-h3 text-ink">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="t-body t-muted mt-5 max-w-2xl">{step.body}</p>
                  <a
                    href={step.href}
                    {...(/^https?:/.test(step.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="mt-7 inline-flex items-center gap-2 border-b-2 border-signal pb-1 font-display text-sm font-bold uppercase tracking-[0.14em] text-navy-600 transition-colors hover:bg-signal hover:text-ink"
                  >
                    {step.hrefLabel}
                    <span aria-hidden="true">{/^https?:/.test(step.href) ? "↗" : "→"}</span>
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* Sign-in explainer — the security promise stated plainly. */}
      <Section tone="navy">
        <div className="u-grid-12 items-start">
          <div className="col-span-12 lg:col-span-5">
            <p className="c-label">The team portal</p>
            <h2 className="t-h2 mt-8 text-white">Sign in with your Ion account</h2>
            <p className="t-body-lg mt-10 text-white/70">
              Members register for tournaments, check dues and orders, and reach the resource library from one place.
              Sign-in happens on <span className="font-semibold text-white">ion.tjhsst.edu</span> — this site never sees
              or stores your Ion password.
            </p>
            <div className="mt-12">
              <ButtonLink href="/signin" variant="primary" size="lg">
                Sign in
              </ButtonLink>
            </div>
          </div>

          <ul className="col-span-12 grid gap-px border-2 border-white/20 bg-white/20 sm:grid-cols-2 lg:col-span-7">
            {PORTAL_FEATURES.map((item) => (
              <li key={item.title} className="bg-navy-900 p-9">
                <h3 className="t-h3 text-white">{item.title}</h3>
                <p className="t-body mt-4 text-white/65">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="raised">
        <SectionHeading eyebrow="Questions" title="Things people ask first" />
        <div className="mt-14 max-w-4xl border-y-2 border-rule">
          {FAQ.map((item) => (
            <details key={item.q} className="group border-b-2 border-rule-faint py-8 last:border-b-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-bold uppercase tracking-tight text-ink marker:content-none">
                {item.q}
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-rule text-xl font-normal leading-none text-navy-600 transition-transform duration-200 group-open:rotate-45 group-open:bg-signal group-open:text-ink"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="t-body t-muted mt-6 max-w-2xl">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="c-frame mt-16 p-10 text-center">
          <p className="t-body-lg t-muted">
            Still unsure? Email{" "}
            <a
              href={`mailto:${settings["club.email"]}`}
              className="border-b-2 border-signal font-semibold text-ink hover:bg-signal"
            >
              {settings["club.email"]}
            </a>{" "}
            or message an officer directly.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <ButtonLink href="/officers" variant="solid">
              Meet the officers
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline">
              Other ways to reach us →
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
