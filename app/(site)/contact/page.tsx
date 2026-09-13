import type { Metadata } from "next";
import Image from "next/image";
import { PageHero, Section, SectionHeading } from "@/components/site/PageHero";
import { LinkCard } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CLUB, EXTERNAL_LINKS, SOCIALS } from "@/lib/content/club";
import { getSettings } from "@/lib/services/settings";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "How to reach TJ Policy Debate — email, Instagram, the members' Facebook group, and Discord.",
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getSettings();

  const channels = [
    {
      href: `mailto:${settings["club.email"]}`,
      icon: "/brand/email.svg",
      name: "Email",
      handle: settings["club.email"],
      description:
        "The officer team reads this address. Best for questions from parents, prospective members, and other schools.",
      cta: "Send an email",
    },
    {
      href: settings["social.instagram"],
      icon: "/brand/instagram.svg",
      name: "Instagram",
      handle: SOCIALS.instagram.handle,
      description: "Tournament results, team photos, and announcements.",
      cta: "Follow the team",
    },
    {
      href: settings["social.facebook"],
      icon: "/brand/facebook.svg",
      name: "Facebook group",
      handle: SOCIALS.facebook.handle,
      description: "Where tournament signups and registration information are posted. For current members.",
      cta: "Open the group",
    },
    {
      href: settings["social.discord"],
      icon: "/brand/discord.svg",
      name: "Discord",
      handle: SOCIALS.discord.handle,
      description: "Day-to-day coordination — practice rounds, file sharing, and quick questions.",
      cta: "Join the server",
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Contact", path: "/contact" }])} />

      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        description="Questions about joining, tournament logistics, or the program in general — start with whichever of these fits."
        index="05"
      />

      <Section tone="raised">
        <SectionHeading eyebrow="Channels" title="Four ways to reach the team" />
        <ul className="mt-16 grid gap-8 sm:grid-cols-2">
          {channels.map((channel, index) => (
            <Reveal as="li" key={channel.name} delay={index * 70}>
              <LinkCard href={channel.href} className="flex h-full flex-col p-10">
                <span className="flex h-16 w-16 items-center justify-center border-2 border-rule bg-navy-800">
                  <Image src={channel.icon} alt="" width={26} height={26} className="h-[26px] w-[26px] invert" />
                </span>
                <h2 className="t-h3 mt-8 text-ink">{channel.name}</h2>
                <p className="mt-3 break-all font-display text-sm font-bold uppercase tracking-[0.1em] text-navy-600">
                  {channel.handle}
                </p>
                <p className="t-body t-muted mt-6">{channel.description}</p>
                <span className="mt-auto pt-8 font-display text-xs font-bold uppercase tracking-[0.16em] text-navy-600">
                  {channel.cta} →
                </span>
              </LinkCard>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section tone="paper">
        <div className="u-grid-12">
          <div className="col-span-12 lg:col-span-6">
            <SectionHeading eyebrow="Address" title="Where we are" />
            <address className="t-body-lg t-muted mt-12 border-l-4 border-navy-600 pl-8 not-italic">
              {CLUB.school}
              <br />
              {settings["club.addressLine1"]}
              <br />
              {settings["club.addressLine2"]}
            </address>
            <p className="t-body t-muted mt-10">
              The team meets during eighth period. Sign up for a block on{" "}
              <a
                href={EXTERNAL_LINKS.ion}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b-2 border-signal font-semibold text-ink hover:bg-signal hover:text-paper"
              >
                Ion
              </a>{" "}
              to visit a meeting.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="c-panel on-dark h-full p-10 md:p-12">
              <p className="c-label">Members</p>
              <h2 className="t-h3 mt-8 text-white">Already on the team?</h2>
              <p className="t-body mt-6 text-white/70">
                Sign in with your Ion account for the tournament calendar, registration, dues status, orders, and the
                resource library.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <ButtonLink href="/signin" variant="primary">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/join" variant="onDark">
                  New here? Start with joining
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
