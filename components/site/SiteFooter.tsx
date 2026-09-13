import Image from "next/image";
import Link from "next/link";
import { CLUB, EXTERNAL_LINKS } from "@/lib/content/club";
import { getSettings } from "@/lib/services/settings";

const NAV_COLUMNS = [
  {
    heading: "The team",
    links: [
      { href: "/about", label: "About" },
      { href: "/officers", label: "Officers" },
      { href: "/achievements", label: "Record" },
      { href: "/news", label: "News" },
    ],
  },
  {
    heading: "Get involved",
    links: [
      { href: "/join", label: "Join the team" },
      { href: "/contact", label: "Contact" },
      { href: "/signin", label: "Team portal" },
      { href: EXTERNAL_LINKS.constitutionPdf, label: "Constitution (PDF)" },
    ],
  },
] as const;

export async function SiteFooter() {
  const settings = await getSettings();

  const socials = [
    { href: settings["social.instagram"], label: "Instagram", icon: "/brand/instagram.svg" },
    { href: settings["social.facebook"], label: "Facebook", icon: "/brand/facebook.svg" },
    { href: settings["social.discord"], label: "Discord", icon: "/brand/discord.svg" },
    { href: `mailto:${settings["club.email"]}`, label: "Email", icon: "/brand/email.svg" },
  ];

  return (
    <footer className="on-dark relative overflow-hidden bg-navy-950 text-white">
      <div className="c-rule-signal" aria-hidden="true" />
      <div className="c-grid-texture absolute inset-0" aria-hidden="true" />

      <div className="u-container relative py-24 md:py-32">
        <div className="u-grid-12">
          <div className="col-span-12 lg:col-span-5">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center border-2 border-white/25 bg-white/5">
                <Image src="/brand/logo.svg" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
              </span>
              <span className="font-display text-xl font-extrabold uppercase leading-[1.02] tracking-tight">
                TJ Policy
                <span className="block text-signal-bright">Debate</span>
              </span>
            </div>

            <p className="mt-8 max-w-sm text-base leading-relaxed text-white/65">
              The Policy Debate team of {CLUB.school}. Varsity and novice squads competing on the local, state, and
              national circuits.
            </p>

            <address className="mt-8 border-l-4 border-signal pl-5 text-sm not-italic leading-relaxed text-white/50">
              {CLUB.school}
              <br />
              {settings["club.addressLine1"]}
              <br />
              {settings["club.addressLine2"]}
            </address>
          </div>

          {NAV_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="col-span-6 lg:col-span-2">
              <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-signal-bright">
                {column.heading}
              </h2>
              <ul className="mt-7 space-y-4">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-base text-white/70 transition-colors hover:text-signal-bright"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-12 lg:col-span-3">
            <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-signal-bright">Connect</h2>
            <ul className="mt-7 flex flex-wrap gap-3">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target={social.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-12 w-12 items-center justify-center border-2 border-white/25 transition-colors hover:border-signal hover:bg-signal/10"
                  >
                    <Image src={social.icon} alt="" width={20} height={20} className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${settings["club.email"]}`}
              className="mt-7 inline-block break-all text-base text-white/70 underline decoration-signal decoration-2 underline-offset-[6px] transition-colors hover:text-signal-bright"
            >
              {settings["club.email"]}
            </a>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t-2 border-white/15 pt-10 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em]">
            © {new Date().getFullYear()} TJHSST Policy Debate
          </p>
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-3 font-display text-xs font-bold uppercase tracking-[0.16em]">
            <li>
              <Link href="/privacy" className="transition-colors hover:text-signal-bright">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-signal-bright">
                Terms
              </Link>
            </li>
          </ul>
          <p>
            Built by {CLUB.siteCredit}. Sign in with{" "}
            <a
              href={EXTERNAL_LINKS.ion}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-signal decoration-2 underline-offset-4 hover:text-signal-bright"
            >
              TJ Ion
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
