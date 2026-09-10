# TJ Policy Debate

The website and internal club platform for the Policy Debate team at Thomas
Jefferson High School for Science and Technology.

Two connected experiences in one application:

- **A public site** — home, about, officer team, achievements, news, contact,
  and a join flow, for prospective students, current students, and parents.
- **A team portal and officer dashboard** behind TJ Ion sign-in — tournament
  registration, dues and order tracking, a resource library, member management,
  analytics, and an audit log.

## Quick start

```bash
npm install
cp .env.example .env.local          # then edit SESSION_SECRET at minimum
npx prisma migrate dev              # creates prisma/dev.db
npm run db:seed:dev                 # club settings + demo accounts and records
npm run dev
```

Open http://localhost:3000. Sign in at `/signin` — in development this shows a
local account picker (**not** Ion, and no password is involved) listing the
seeded accounts. `2027demoofficer` is an officer; `2028demomember` is a member.

Switching to real Ion sign-in is two environment variables and a redirect URI —
see [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md).

## Scripts

| Command               | What it does                                              |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Development server                                         |
| `npm run build`       | Production build (runs `prisma generate` first)            |
| `npm start`           | Serve the production build                                 |
| `npm run typecheck`   | TypeScript, no emit                                        |
| `npm run lint`        | ESLint                                                     |
| `npm test`            | Vitest unit suite                                          |
| `npm run db:migrate`  | Create and apply a migration                               |
| `npm run db:deploy`   | Apply migrations (deployment)                              |
| `npm run db:seed`     | Baseline seed — safe against production                    |
| `npm run db:seed:dev` | Baseline plus demo accounts and sample records             |
| `npm run db:reset`    | Drop, migrate, and reseed with demo data                   |
| `npm run db:studio`   | Prisma Studio                                              |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — stack, data model, request flow
- [Integrations](docs/INTEGRATIONS.md) — Ion, Tabroom, openCaselist, MySchoolBucks
- [Deployment](docs/DEPLOYMENT.md) — hosting, environment, first-run checklist
- [Security](docs/SECURITY.md) — controls, threat model, what is deliberately absent
- [Content review](docs/CONTENT-REVIEW.md) — facts carried over, and what needs checking

## Layout

```
app/
  (site)/        Public pages — dark hero, shared header and footer
  portal/        Member area  — requires a session
  admin/         Officer area — requires the OFFICER role
  api/           Route handlers; /api/admin/* is officer-only
components/
  ui/            Buttons, cards, badges, forms, tables, states, icons
  site/          Public header, footer, hero and section primitives
  app/           Shell, filters, and controls shared by portal and dashboard
lib/
  auth/          Provider abstraction, Ion OAuth, sessions, guards
  services/      All database access, grouped by domain
  integrations/  Tabroom, openCaselist, MySchoolBucks
  validation/    zod schemas for every request body
  content/       Facts carried over from the previous site
prisma/          Schema, migrations, seed
tests/           Vitest unit suite
```

## Conventions worth knowing

- **Services own the database.** Pages and route handlers never call `prisma`
  directly for anything non-trivial, and member-facing queries use `select`
  lists that cannot return officer-only columns.
- **Statuses are strings, validated centrally.** SQLite has no enum type, so
  `lib/constants.ts` defines every vocabulary and `lib/validation/schemas.ts`
  derives its zod unions from it. Adding a status in one place without the
  other will not compile.
- **Authorization is server-side, always.** `lib/auth/guards.ts` is the only
  way in. Hiding a button is presentation, never a control.
- **Nothing competitive is invented.** The achievements table ships empty; the
  officer dashboard is the only way results reach the public site.

Built for the TJHSST Policy Debate team. Original site by Ritham Reddy ('28).
