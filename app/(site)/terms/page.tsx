import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/site/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { CLUB } from "@/lib/content/club";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { LegalBody, LegalSection, LegalUpdated } from "../legal-parts";

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  description:
    "The rules for using the TJ Policy Debate site and member portal: who may sign in, what the officer team commits to, and what happens to accounts that are misused.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Terms of use", path: "/terms" }])} />

      <PageHero
        eyebrow="Terms of use"
        title="The rules of the site"
        description="Short, and written to be read. Using the site or signing in to the member portal means these apply to you."
        index="06"
      />

      <Section tone="raised">
        <LegalBody>
          <LegalUpdated />

          <LegalSection title="What this site is">
            <p>
              This is the website of TJ Policy Debate, a student activity at {CLUB.school}. The public pages describe
              the team. The member portal handles tournament registration, dues, orders, and team resources for people
              on the squad.
            </p>
            <p>
              It is run by students. It is not an official publication of {CLUB.schoolShort} or of Fairfax County Public
              Schools, and nothing here speaks for the school.
            </p>
          </LegalSection>

          <LegalSection title="Who may sign in">
            <p>
              The portal is for current members of the team, and sign-in requires a working Ion account. Do not sign in
              on someone else&rsquo;s behalf, and do not share your account. If you leave the team, an officer may make
              your account inactive or remove it.
            </p>
          </LegalSection>

          <LegalSection title="Using it properly">
            <p>Do not:</p>
            <ul>
              <li>Register anyone but yourself for a tournament, or enter a partner who has not agreed.</li>
              <li>Submit details you know to be wrong — officers enter them on Tabroom exactly as given.</li>
              <li>
                Try to reach another member&rsquo;s records, or any officer-only page, if you are not an officer.
              </li>
              <li>Probe, scrape, or attack the site, or attempt to get around sign-in.</li>
              <li>Upload or link anything unlawful, harassing, or against school rules.</li>
            </ul>
            <p>Officers may suspend or delete an account that is used this way.</p>
          </LegalSection>

          <LegalSection title="Registering for tournaments">
            <p>
              Registering here tells the officer team you want to compete. It is a request, not a confirmed entry — an
              officer reviews it and enters the squad on Tabroom, and a slot is not guaranteed. Withdraw as early as you
              can if plans change, so the place can go to someone else.
            </p>
          </LegalSection>

          <LegalSection title="Dues and payments">
            <p>
              This site never takes a payment and never asks for card or bank details. Amounts shown are a record of
              what officers have logged; payment itself goes through MySchoolBucks. An officer ticks each item off after
              confirming it, so there is often a delay between paying and seeing it clear here.
            </p>
            <p>
              If a figure looks wrong, tell the treasurer. If cost is a barrier to competing, tell an officer — it is
              not meant to stop anyone.
            </p>
          </LegalSection>

          <LegalSection title="Resources and files">
            <p>
              Evidence, case files, and guides in the resource library are for team use. Much of it is the work of
              current and former members, and some of it quotes copyrighted material under fair use for educational
              purposes. Do not republish it outside the team.
            </p>
          </LegalSection>

          <LegalSection title="Content you post">
            <p>
              You keep ownership of anything you write — a news post, a registration note. By posting it you let the
              team display it on this site. Officers may edit or remove anything, and if your account is deleted your
              posts stay up but are no longer attributed to you.
            </p>
          </LegalSection>

          <LegalSection title="Availability">
            <p>
              This is a student project running on donated or low-cost hosting. It may be slow, briefly down, or taken
              offline for maintenance without warning. Do not treat it as the only record of a registration or a
              payment — if a deadline is close, confirm with an officer directly.
            </p>
          </LegalSection>

          <LegalSection title="Links to other sites">
            <p>
              Tabroom, Ion, MySchoolBucks, Instagram, Discord, and the Facebook group are run by other people under
              their own terms and privacy policies. We do not control them and are not responsible for them.
            </p>
          </LegalSection>

          <LegalSection title="Changes">
            <p>
              These terms may change as the site does. The date at the top is the last revision. Continuing to use the
              site after a change means the new version applies.
            </p>
          </LegalSection>

          <LegalSection title="Getting in touch">
            <p>
              Questions, corrections, or a request to remove your account:{" "}
              <a href={`mailto:${CLUB.email}`} className="legal-link">
                {CLUB.email}
              </a>
              , or speak to any officer.
            </p>
          </LegalSection>

          <LegalSection title="A note on scope">
            <p className="legal-note">
              This page sets out house rules for a student-run club website in plain language. It is not legal advice
              and is not a contract drafted by a lawyer. School policy governs where the two differ — if this site is
              adopted officially, the school&rsquo;s administration should review this page first.
            </p>
          </LegalSection>

          <p className="legal-footer">
            See also the{" "}
            <Link href="/privacy" className="legal-link">
              privacy policy
            </Link>
            .
          </p>
        </LegalBody>
      </Section>
    </>
  );
}
