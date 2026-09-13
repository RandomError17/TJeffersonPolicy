# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: members and officers of TJ Policy Debate**, a student-run policy
debate team at Thomas Jefferson High School for Science and Technology
(TJHSST). Members sign in with their school Ion account to register for
tournaments, track dues, view resources, and see their awards. Officers use an
admin dashboard to run the club day to day: publish news, manage the member
roster and dues, open/close tournament registration, manage merchandise
orders, and review an audit log of privileged actions.

**Secondary: prospective students and their parents**, who land on the public
marketing pages (home, about, achievements, officers, join, contact) while
deciding whether to join or evaluating the program's credibility. The site is
live and in active use this season — this is not a pre-launch or demo product.

## Product Purpose

One deployable that is both the club's public face and its internal
operations system: a marketing site that explains the program and recruits
new debaters, plus a members portal and officer admin panel that replace what
would otherwise be spreadsheets, group chats, and manual payment tracking for
dues, tournament registration, and merchandise orders.

Success is officers spending less time on club administration and more on
coaching/competing, and prospective members having enough real information
(what the team does, how to join, who runs it) to decide to show up.

## Positioning

Unlike a typical student-club website (a static page plus a signup form), this
is a real internal application: authenticated through the school's own Ion
OAuth SSO (no separate password to manage), with itemized dues tracking,
divisioned tournament registration (varsity/novice, per-division fees and
caps), an append-only audit log of officer actions, and role-based access
enforced server-side on every page and endpoint — appropriate for a system
that holds data about minors.

## Operating Context

- School: Thomas Jefferson High School for Science and Technology (TJHSST).
  Identity/auth is TJ's own **Ion** system (OAuth 2.0, not OIDC).
- Competitive activity: policy debate, run in varsity and novice divisions
  across local, state, and national circuits.
- A debate season has phases (see `lib/content/club.ts` `SEASON_PHASES`) with
  a regular meeting cadence (`MEETINGS`).
- Tournament registration involves per-division fees/caps, and registration
  contact info (school, Tabroom email, phone, grade, partner's school email)
  is captured fresh at registration time, not read from a stored profile.
- External services the team actually depends on: **Tabroom** (read-only
  public JSON lookup, officer-initiated), **MySchoolBucks** (outbound payment
  link only — this app does not process payments), **NSDA** (outbound link;
  membership tracked manually, no public API), **Discord** (community
  invite). **openCaselist** is deep-linked only; no real integration exists
  because it's per-user auth only.
- Officers configure club-wide settings themselves (contact email, Discord
  invite, MySchoolBucks link, published figures) through the admin dashboard
  rather than through a code change.

## Capabilities and Constraints

- **Auth is Ion-only.** There is no password field anywhere in the app. In
  production `AUTH_PROVIDER=ion` is required; a `dev` bypass provider exists
  for local development only and is refused in production.
- Ion tells us a user is a TJ student/teacher/counselor; it has no concept of
  a debate officer. The **officer role** comes from a standing
  `OFFICER_USERNAMES` config list (re-applied every sign-in) or a promotion
  made in the dashboard — and the list can only ever promote, never silently
  demote.
- Roles are re-read from the database on every request. A demotion is
  immediate and ends that user's sessions everywhere.
- Every mutating endpoint goes through one wrapper (`withApi()`) that enforces
  origin check → CSRF → rate limit → authorization → zod validation, in that
  order, before touching data — a deliberate constraint so a step can't be
  skipped by a future endpoint.
- Officer-only fields (e.g. `officerNotes`, other members' registrations) are
  structurally absent from the queries member-facing pages use, not just
  hidden in the UI.
- Database is Postgres (via Neon) through Prisma; the schema was written
  portable from an original SQLite design, but the live deployment is
  Postgres now (docs/DEPLOYMENT.md's SQLite section is historical).
- Hosting is usage-billed (Vercel + Neon) with no built-in spend ceiling — a
  club with no budget has to set spend caps by hand in those dashboards
  (docs/COSTS.md). This shapes an implicit constraint: features shouldn't
  introduce open-ended usage-scaling costs (e.g. unbounded background jobs,
  large media/storage) without that tradeoff being deliberate.
- Data sensitivity: the app holds real information about minors (names,
  grades, school email, dues status, tournament entries, orders) and is held
  to that standard throughout — see docs/SECURITY.md.

## Brand Commitments

- Name: **TJ Policy Debate** (also "Jefferson Policy Debate" in on-site
  headline copy). This is also the name registered with Ion for its OAuth
  consent screen, so it's a binding, user-facing identity string, not just a
  stylistic choice.
- Existing visual identity already implemented in `app/globals.css` (navy
  `#1B3A93`, sourced from the team's own seal, plus a paper ground and a
  reserved signal-amber accent) and brand assets in `public/brand/` (team
  photo, logo, TJ logo, seal-derived imagery). This is incumbent design
  authority to preserve/extend, not a decision made by this init pass.

## Evidence on Hand

- All factual site content was migrated from a previous `JeffersonPolicy-main`
  archive; nothing about the team was invented for this build
  (docs/CONTENT-REVIEW.md).
- **Open/unverified, carried forward from the old site — do not treat as
  measured facts, do not extend them with more specifics:**
  - "50+ debaters" and "10+ tournaments a year" (round, undated, self-reported
    figures). The officer dashboard can eventually show a real member count
    to replace the claim once enough members have signed in.
  - Competitive claims ("earned TOC bids, won at VHSLs, placed at NCFL
    nationals", "one of the best teams in the nation") with no tournament,
    year, or debater specified anywhere in the source archive.
  - Two different Discord invite links existed in the old archive; the one
    used site-wide (`discord.gg/Mw8Vfu7RpD`) was chosen because it appeared on
    every page, not because it was confirmed current.
  - A second contact address (`contact@tjpolicy.com`) appears obsolete next to
    the address used everywhere else (`tjhsstpolicy1@gmail.com`) and is
    intentionally unused.
- Real assets on hand: team photo, club logo/seal art, TJ logo
  (`public/brand/`), and the team constitution (`public/docs/constitution.pdf`).

## Product Principles

1. **Server-enforced, not UI-enforced.** Authorization, data visibility, and
   audit logging happen server-side by structural default (guards, query
   shape, the single mutation wrapper) — hiding a control in the UI is never
   sufficient on its own.
2. **Content honesty over polish.** Don't launder unverifiable legacy claims
   into more specific or more confident-sounding copy; prefer "unverified" or
   a real, current number over a persuasive guess.
3. **Officer workflows are the product, not an afterthought.** The public
   marketing pages recruit; the portal/admin surfaces are where the club
   actually runs, and should be optimized for the people using them every
   week during a season.
4. **Cost-aware by design.** This is a volunteer/student-run club with no ops
   budget and usage-billed hosting; avoid patterns that create open-ended
   scaling cost without a deliberate reason.
5. **One config change from real, not simulated.** Where a real integration
   exists (Ion, Tabroom), build and verify it against the truth; where none
   exists (openCaselist, NSDA, payment processing), link out rather than
   fake a deeper integration.

## Accessibility & Inclusion

Motion is opt-in and respects `prefers-reduced-motion` (CSS transitions and
`IntersectionObserver`-driven reveals only, no animation library). No further
project-specific accessibility standard has been established beyond this.
