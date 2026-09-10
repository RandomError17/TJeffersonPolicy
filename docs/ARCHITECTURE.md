# Architecture

## Stack, and why

| Layer      | Choice                          | Reasoning                                                                                                                                                            |
| ---------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router)         | One deployable serving both a marketing site and an internal app. Server Components keep member data on the server; route handlers give an explicit, auditable write path. |
| Language   | TypeScript (strict)             | The data model has a lot of small vocabularies (statuses, roles, categories). Types catch drift between them at compile time.                                          |
| Styling    | Tailwind CSS v4                 | Design tokens live in CSS (`app/globals.css` `@theme`), so the palette is one file and no config build step is needed.                                                 |
| Database   | SQLite via Prisma               | Club scale is a few hundred rows. A file database means zero-setup local development and trivial backups; Prisma keeps the migration path to Postgres open.            |
| Auth       | Hand-rolled OAuth 2.0 + DB sessions | Ion is plain OAuth 2.0, not OIDC. A ~200-line provider interface fits it exactly, avoids a beta dependency, and makes the swap from development to Ion a config change. |
| Validation | zod v4                          | One schema per request body, unions derived from the same constants the UI renders.                                                                                    |
| Animation  | CSS transitions + IntersectionObserver | No animation library. Every entrance is opt-in, respects `prefers-reduced-motion`, and fails to *visible*.                                                     |

Deliberately **not** used: an ORM-free query layer (too much hand-written SQL for
a team that turns over yearly), NextAuth (its Ion story would be a custom
provider anyway, and it is still pre-1.0 at v5), a component library (the design
brief rules out a generic look), and an icon package (a dozen inline SVGs cost
less than a dependency).

## Request flow

```
Browser
  │
  ├─ proxy.ts ......... security headers + per-request CSP nonce
  │
  ├─ Server Component ─ lib/auth/guards.ts  → redirect if unauthorised
  │                     lib/services/*      → Prisma → SQLite
  │                     render (no member data reaches the client bundle)
  │
  └─ Route handler ──── lib/http/api.ts withApi()
                          ├ assertSameOrigin      Origin must match APP_URL
                          ├ assertCsrfToken       double-submit cookie
                          ├ consume()             rate limit
                          ├ requireUserApi()/requireOfficerApi()
                          ├ readJson(schema)      zod validation
                          ├ lib/services/*        the actual work
                          └ recordAudit()         append-only log
```

Reads happen in Server Components; writes go through route handlers. The split
is deliberate: it means every mutation passes through one wrapper that cannot be
forgotten, and page code stays free of security plumbing.

## Data model

Fifteen tables. `prisma/schema.prisma` is commented; the shape is:

**Identity** — `User` (Ion username is the stable key; `role` is the sole
authorization input), `Session` (server-side, cookie holds an opaque token,
only its SHA-256 is stored), `AuthRequest` (short-lived OAuth state + PKCE
verifier).

**Competition** — `Tournament` → `TournamentDivision` → `TournamentRegistration`.
Divisions are the unit a member registers for, so a tournament can run varsity
and novice entries with different fees and caps. Contact details (school and
Tabroom email, phone, grade, partner's school email) are collected fresh onto
each `TournamentRegistration` rather than read from the member's profile — see
[Registration details are a snapshot, not a profile lookup](#registration-snapshot).

**Operations** — `OrderItem` (officer-editable catalogue) → `Order`, and
`DuesRecord` (a rare per-season override, not a ledger) — see
[Dues are computed, not entered](#dues-are-computed-not-entered). Nothing here
is a payment instrument; no card or bank detail is stored anywhere in this
schema.

**Content** — `Achievement` (public results) with optional per-member `Award`
rows, `NewsPost` (draft/published), `OfficerProfile` (the public roster),
`Resource` (member library, never public).

**Config and oversight** — `ClubSetting` (key/value, so officers change facts
without a deploy) and `AuditLog` (append-only, actor name denormalised so
history survives account deletion).

### Two shapes for one table

Anything a member can read has a narrowed `select` in the service layer.
`memberTournamentSelect` in `lib/services/tournaments.ts` is the clearest
example: `officerNotes` is not in the list, so no member-facing code path can
return it even by accident. The officer variants are separate functions.

### Strings instead of enums

SQLite has neither enums nor arrays. Status columns are plain strings and
list columns are JSON text. Three things keep that honest:

1. `lib/constants.ts` defines every vocabulary as a `const` map of key → label.
2. `lib/validation/schemas.ts` derives its zod unions from those maps, so the
   API accepts exactly the documented values.
3. `labelFor()` never renders an unrecognised value — it falls back rather than
   printing a raw database string, and it ignores inherited object properties.

Moving to PostgreSQL later means changing `provider` in the schema and
regenerating migrations; no column type is SQLite-specific.

### Registrations and orders share one workflow

Both use `SIMPLE_STATUSES` in `lib/constants.ts`: **Pending**, **Waitlisted**,
**Registered**. Withdrawing a registration or removing an order does not add a
fourth "withdrawn"/"cancelled" value — the row is deleted (see
`withdrawRegistration` in `lib/services/registrations.ts`), so the vocabulary
stays exactly three values everywhere it appears, including the officer status
dropdown. History of a withdrawal is therefore not retained; that trade-off was
made deliberately in favour of a simpler status model.

### Registration details are a snapshot, not a profile lookup {#registration-snapshot}

`TournamentRegistration` carries its own `schoolEmail`, `tabroomEmail`,
`phoneNumber`, `grade`, and `partnerSchoolEmail`, collected on the form every
time a member registers, rather than joined live from `User` at read time.
Officers need the exact contact details that were true for *that* tournament —
for Tabroom entry and day-of contact — and a profile edited afterward should
not silently rewrite history. The form pre-fills from the member's profile and
their most recent registration purely as a convenience; nothing is ever
submitted without the member seeing and confirming it. `User.phoneNumber` is
a cache updated on each submission solely to make that pre-fill possible.

### Dues are computed, not entered {#dues-are-computed-not-entered}

There is no dues ledger. What a member owes is the sum of their tournament
division fees and order costs that are not yet checked off paid — see
`seasonBalance` in `lib/services/dues.ts` — and it reaches exactly $0 once
every item is checked. There is no separate "mark the season paid" action,
because once nothing is left owing there is nothing left to mark.

The checking-off happens per item, on the member's own profile
(`/admin/members/[id]`): a checkbox next to each registration's fee
(`TournamentRegistration.feePaid`) and each order's cost (`Order.paid`). The
`/admin/dues` page is a read-only roster — it computes the same balance for
every active member so a treasurer can see who owes what, and links through to
each profile for the actual work.

`DuesRecord` still exists, but only for a season-level **waiver**: an explicit
excuse from paying at all, for a hardship case, with a note the member can see.
It is the one thing about a balance an officer sets directly rather than by
checking off items — everything else derives from the two boolean columns
above, recomputed live on every page load rather than cached, so it can never
drift out of sync with the fees and orders it is built from.

## Design system

Tokens are defined once in `app/globals.css` under `@theme`.

- **Navy** `#274690` is the team's own colour, lifted from the previous site's
  stylesheets and extended into a 50–950 scale.
- **Gold** `#c9a227` is reserved for competitive results, so an award always
  reads as an award and never as decoration.
- **Ink** is a near-black with a navy cast, used for the dark sections that
  separate the public page rhythm.
- **Type** pairs Source Serif 4 for headings with Inter for interface text —
  academic without being fusty.

The site commits to one light identity with deliberate dark bands rather than
following the OS theme: the seal, the team photograph, and the achievement
typography are all tuned for a single ground, and `color-scheme: light` is set
explicitly so form controls do not invert underneath the design.

## Accessibility

Semantic landmarks, a skip link, one visible focus style that is never removed,
labelled form controls with `aria-describedby` wired to hints and errors,
`aria-live` on filter result counts, keyboard-reachable scroll regions on wide
tables, and `prefers-reduced-motion` respected in both CSS and the JavaScript
that drives entrances. Filters and the achievements timeline enhance a list that
is already fully rendered server-side.
