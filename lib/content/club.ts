/**
 * Club facts carried forward from the previous TJ Policy Debate site.
 *
 * Everything here was read out of the supplied `JeffersonPolicy-main` archive —
 * nothing is invented. Each entry notes the file it came from so a future
 * maintainer can tell club fact from site copy. Values that officers should be
 * able to change without a deploy are seeded into the ClubSetting table
 * (see prisma/seed.ts) and read through lib/services/settings.ts at runtime;
 * the constants below are only the initial defaults.
 *
 * Items marked NEEDS REVIEW were contradictory or unverifiable in the source
 * material and are surfaced in docs/CONTENT-REVIEW.md rather than silently
 * resolved.
 */

export const CLUB = {
  /** views/partials/header.ejs, views/index.ejs */
  shortName: "TJ Policy Debate",
  wordmark: "Jefferson Policy",
  school: "Thomas Jefferson High School for Science and Technology",
  schoolShort: "TJHSST",

  /** views/partials/footer.ejs */
  addressLine1: "6560 Braddock Rd",
  addressLine2: "Alexandria, VA 22312",

  /** views/partials/footer.ejs, views/resources.ejs, calendar embed src */
  email: "tjhsstpolicy1@gmail.com",

  /** views/partials/footer.ejs — "Built by Ritham Reddy ('28)" */
  siteCredit: "Ritham Reddy ('28)",
} as const;

export const SOCIALS = {
  /** views/resources.ejs, views/partials/footer.ejs */
  instagram: { handle: "@tj.policy", url: "https://www.instagram.com/tj.policy/" },
  /** views/partials/footer.ejs, views/join.ejs — the members' signup hub */
  facebook: { handle: "TJ Policy Debate Group", url: "https://www.facebook.com/share/g/1BYMZWTzEZ/" },
  /**
   * NEEDS REVIEW: the archive contains two different Discord invites —
   * https://discord.gg/Mw8Vfu7RpD (footer.ejs) and
   * https://discord.gg/MzPaDcpMu (resources.ejs). The footer link is used here
   * because it appeared on every page; confirm before launch.
   */
  discord: { handle: "TJ Policy Debate Server", url: "https://discord.gg/Mw8Vfu7RpD" },
} as const;

/** views/index.ejs — Ion eighth-period activity links. */
export const MEETINGS = [
  {
    squad: "Varsity",
    when: "Wednesday B Block",
    detail: "Advanced case work and practice rounds",
    ionActivityUrl: "https://ion.tjhsst.edu/eighth/activity/126",
  },
  {
    squad: "Novice",
    when: "Friday A Block",
    detail: "Fundamentals, drills, lectures, and an introduction to the format",
    ionActivityUrl: "https://ion.tjhsst.edu/eighth/activity/279",
  },
] as const;

/** views/index.ejs — the season shape the team already publishes. */
export const SEASON_PHASES = [
  { window: "September – October", detail: "Season kickoff invitational tournaments" },
  { window: "November – January", detail: "Mid-season regionals (WASDL) and national circuit tournaments" },
  { window: "February – March", detail: "VHSL Districts, WASDL Metrofinals, and State Championships" },
  { window: "April – May", detail: "TOC, NCFL Nationals, and end-of-season tournaments" },
] as const;

export const EXTERNAL_LINKS = {
  /** views/calendar.ejs */
  googleCalendarEmbed:
    "https://calendar.google.com/calendar/embed?src=tjhsstpolicy1%40gmail.com&ctz=America%2FNew_York&showTitle=0&showPrint=0&color=%23274690",
  /** views/lectures.ejs */
  lectureSlidesFolder: "https://drive.google.com/embeddedfolderview?id=1vw8WisSrtpeGMjUWZSj91M-VVN1ycArO#list",
  lectureSlidesFolderOpen: "https://drive.google.com/drive/folders/1vw8WisSrtpeGMjUWZSj91M-VVN1ycArO",
  /** static/images/Constitution-2025-09-08.pdf, republished at /docs/constitution.pdf */
  constitutionPdf: "/docs/constitution.pdf",
  constitutionDate: "2025-09-08",
  ion: "https://ion.tjhsst.edu/",
  tabroom: "https://www.tabroom.com/",
  openCaselist: "https://opencaselist.com/",
  nsda: "https://www.speechanddebate.org/",
} as const;

/**
 * views/index.ejs hero. These are the team's own published figures, not
 * measurements taken by this application, so they are officer-editable and
 * labelled as approximate. NEEDS REVIEW each season.
 */
export const PUBLISHED_FIGURES = {
  activeDebaters: "50+",
  tournamentsPerYear: "10+",
} as const;

/**
 * Officer roster for the 2025–26 season, transcribed from views/officers.ejs.
 * Email addresses are the personal ones the officers already published there.
 */
export const OFFICER_ROSTER_2025 = [
  { name: "Sanat Seth", position: "Captain", email: "sanatseth08@gmail.com" },
  { name: "Siddharth Surapaneni", position: "Captain", email: "siddu.surapaneni@gmail.com" },
  { name: "Prady Chivukula", position: "Teaching Coordinator", email: "prady.wrld@gmail.com" },
  { name: "Siddarth Sankar", position: "Teaching Coordinator", email: "realsidhere@gmail.com" },
  { name: "Ritham Reddy", position: "Webmaster / Publicist", email: "rithamreddy17@gmail.com" },
  { name: "Akshay Chapuri", position: "Treasurer", email: "akshay.chapuri@gmail.com" },
] as const;

/** views/index.ejs — the team's own description of the format. */
export const POLICY_EXPLAINER = [
  {
    title: "Affirmative & Negative",
    body: "Each round, one team defends a policy change (Affirmative) while the other argues against it (Negative). Teams switch sides each round.",
  },
  {
    title: "Year-Long Resolution",
    body: "A single national topic is debated all year, letting debaters develop deep expertise in a complex policy area like healthcare, defense, or energy.",
  },
  {
    title: "Evidence-Based",
    body: "Arguments are backed by evidence cut from academic journals, government reports, and news sources, which builds genuine research skills.",
  },
  {
    title: "Critical Thinking",
    body: "Debaters think on their feet, respond to complex arguments, and construct rebuttals in real time under competitive pressure.",
  },
] as const;

/** views/join.ejs — the existing five-step onboarding path, preserved verbatim in substance. */
export const JOIN_STEPS = [
  {
    title: "Join the Facebook group",
    body: "Tournament signups, registration information, and club announcements all land in the members' Facebook group first.",
    href: SOCIALS.facebook.url,
    hrefLabel: "Open the group",
  },
  {
    title: "Find a partner",
    body: "Policy is a two-person event. Ask around, or tell an officer you need pairing help and we will match you.",
    href: "/officers",
    hrefLabel: "Meet the officers",
  },
  {
    title: "Come to a meeting",
    body: "Varsity meets Wednesday B block and novice meets Friday A block. Sign up on Ion — no experience required.",
    href: MEETINGS[1].ionActivityUrl,
    hrefLabel: "Novice activity on Ion",
  },
  {
    title: "Make a Tabroom account",
    body: "Tabroom runs tournament registration and pairings across the circuit. Creating an account is free and takes a minute.",
    href: EXTERNAL_LINKS.tabroom,
    hrefLabel: "tabroom.com",
  },
  {
    title: "Sign in and register",
    body: "Sign in here with your Ion account to see the tournament calendar, register for entries, and track dues and orders in one place.",
    href: "/portal",
    hrefLabel: "Open the team portal",
  },
] as const;
