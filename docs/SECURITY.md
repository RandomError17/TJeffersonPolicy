# Security

This application holds information about minors: names, grades, school email
addresses, dues status, tournament entries, and orders. It is written to that
standard.

## Authentication

- **Sign-in happens on ion.tjhsst.edu.** There is no password field in this
  codebase. Search it — there isn't one.
- **OAuth 2.0 authorization code with PKCE (S256).** The `state` value and the
  PKCE verifier live in a short-lived `AuthRequest` row; the verifier never
  reaches the browser. `state` is consumed exactly once, deleted whether or not
  the exchange succeeds, and expires after ten minutes.
- **No provider tokens are retained.** The access token reads the profile once
  and is discarded. No refresh token is stored.
- **Sessions are server-side.** The cookie holds a 256-bit random token and
  nothing else — no user id, no role, no name. Only `SHA-256(token)` is stored,
  so a database dump cannot be replayed. Cookies are `httpOnly`, `SameSite=Lax`,
  `Secure` in production, and expire after seven days with a sliding refresh.
- **Roles are read from the database on every request**, never from the cookie
  or a request body. A demotion takes effect immediately, and changing a role
  ends that user's sessions in every browser.
- **The officer role never comes from Ion.** Ion has no concept of a debate
  officer. It comes from `OFFICER_USERNAMES` — a standing list in configuration,
  re-applied at each sign-in — or from a promotion made in the dashboard. The
  list only ever promotes, so it cannot silently strip a role, and the dashboard
  refuses to demote someone on it rather than letting the change revert at their
  next sign-in.

## Authorization

Every protected page and endpoint goes through `lib/auth/guards.ts`:

| Helper                    | Used by                                                  |
| ------------------------- | -------------------------------------------------------- |
| `requireUserPage`         | Portal layouts and pages — redirects to sign-in           |
| `requireOfficerPage`      | Admin layouts and pages — redirects members to the portal |
| `requireUserApi`          | Member endpoints — 401                                    |
| `requireOfficerApi`       | Every `/api/admin/*` endpoint — 403                       |
| `assertCanActOnUser`      | Anything taking a user id — members may only act on self  |

Hiding a button is presentation, never a control. Verified by test and by
request: a member session receives 307 away from every `/admin` page and 403
from every `/api/admin/*` endpoint, including the CSV exports.

Two structural protections:

- **Members cannot name a target.** Member endpoints take the acting user from
  the session; there is no `userId` field in `createRegistrationSchema`,
  `createOrderSchema`, or `updateProfileSchema` to forge.
- **Officer-only columns are absent from member queries.** `officerNotes`,
  `officerNote`, and other people's registrations are not in the `select` lists
  member-facing services use, so a component cannot leak them by accident.

## Request integrity

`withApi()` in `lib/http/api.ts` wraps every mutating endpoint and applies, in
order: Origin check, CSRF check, rate limit, authorization, zod validation,
then the handler. Because it is one wrapper, an endpoint cannot forget a step.

- **CSRF**: three independent layers — `SameSite=Lax` on the session cookie, an
  `Origin`/`Referer` match against `APP_URL`, and a double-submit token (a
  readable cookie echoed in `X-CSRF-Token`, compared in constant time). Verified:
  a missing Origin, a wrong Origin, a missing token, and a wrong token each
  return 403.
- **Rate limiting**: fixed-window, in-process. Sign-in gets a tighter budget
  (10 per 10 minutes) than ordinary writes (60 per minute); outbound Tabroom
  calls are limited separately. The key map is bounded so a flood of distinct
  keys cannot exhaust memory. *This is per instance* — a multi-instance
  deployment should move `consume()` behind Redis or the platform limiter.
- **Validation**: every request body is parsed by a zod schema before it reaches
  a service. Unknown keys are stripped, not passed through.
- **Body size**: JSON bodies over 200 KB are rejected with 413.

## Injection and output safety

- **SQL**: all access is through Prisma's parameterised query builder. There is
  no raw SQL in the codebase.
- **XSS**: the only `dangerouslySetInnerHTML` in the app renders news bodies
  through `lib/utils/markdown.ts`, which escapes the source *first* and then
  re-introduces a fixed tag set. There is no raw-HTML passthrough and no way to
  emit an attribute other than a vetted `href`. Tested against `<script>`,
  inline event handlers, `javascript:`, `data:`, and protocol-relative URLs.
- **Link schemes**: `externalUrlSchema` allows only `http`, `https`, and
  `mailto`, so a stored `javascript:` URL cannot reach an anchor.
- **CSV injection**: exported cells beginning `=`, `+`, `-`, `@`, tab, or CR are
  prefixed with an apostrophe so a spreadsheet treats them as text.
- **Security headers** (`proxy.ts`): a per-request nonce CSP in production
  (`strict-dynamic`, no `unsafe-inline` for scripts), `frame-ancestors 'none'`,
  `form-action` limited to self and ion.tjhsst.edu, `nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  a restrictive `Permissions-Policy`, `COOP: same-origin`, and HSTS with preload.
  Signed-in routes are additionally marked `no-store`.

## Privacy

- **Public pages expose only what is intentionally public.** The officers page
  shows people who have an officer profile with `isPublic` set, using the
  contact address they chose to publish — never a school email. The achievements
  page shows names officers entered deliberately, with a warning in the
  dashboard that they appear on the open internet.
- **Nothing private is public.** Dues, registrations, orders, profiles, and the
  resource library are all behind sign-in. `robots.txt` disallows them and every
  authenticated layout sets `noindex, nofollow, nocache`.
- **Minimal collection, and scoped to why it's needed.** Ion's own API already
  strips addresses, phone numbers, and personal emails before we see them. The
  one place this application collects that kind of contact detail itself is
  the tournament registration form — a phone number, a Tabroom email, and a
  partner's school email, because officers genuinely need them to enter the
  team on Tabroom and to reach a debater during a tournament. Those fields
  live only on the `TournamentRegistration` row that collected them: never
  shown publicly, never joined into the public officer roster, and readable
  only by the member themselves and officers (see
  [Registration details are a snapshot](ARCHITECTURE.md#registration-snapshot)
  for why they are stored per-registration rather than merged into the shared
  profile).
- **Third-party data is not hoarded.** The Tabroom import keeps scheduling
  metadata and discards the entry lists, judges, and results that come with it.
- **IP addresses are hashed**, salted with `SESSION_SECRET` and truncated, and
  used only to correlate audit entries.

## Secrets

- Everything sensitive comes from the environment through `lib/env.ts`, which
  validates at load and fails loudly on a misconfigured deploy.
- `.gitignore` excludes `.env*` (with `!.env.example`) and the SQLite files.
  No secret is committed.
- `SESSION_SECRET` must be at least 32 characters. In production, `APP_URL`
  must be `https://` — otherwise session cookies could not be marked `Secure`,
  so the app refuses to start.
- The Ion token exchange response is never logged: an error body can echo the
  client secret back.

## Audit

`AuditLog` is append-only — rows are written and read, never updated or deleted
by the application. It records sign-ins, role changes, member edits, tournament
and registration changes, dues and order updates, publishing, resource and
achievement changes, officer changes, and settings edits. Actor names are
denormalised so history stays readable after an account is removed. Auditing
failures are logged but never break the action being recorded.

## Deliberately absent

- **Payment processing.** No card number, bank detail, or processor token has a
  column in the schema or a field in any endpoint. Members pay in MySchoolBucks;
  officers record the outcome.
- **Ion credential handling.** No password field, no credential storage, no
  scraping.
- **openCaselist API access.** Its only auth mechanism is a per-user Tabroom
  login — see [INTEGRATIONS.md](INTEGRATIONS.md).
- **File uploads.** Resources are links to wherever the team already hosts
  files, which avoids running an upload path and a virus-scanning story.

## Known limitations

1. **Rate limiting is per instance.** Fine for one server; a horizontally
   scaled deployment needs shared state behind `consume()`.
2. **CSP allows `unsafe-inline` for styles.** Tailwind and `next/font` emit
   inline styles with no nonce path. Scripts are nonce-protected.
3. **Officer trust is flat.** Any officer can do anything an officer can do,
   including changing roles. The audit log is the control; the last officer
   cannot be demoted, so the team cannot lock itself out.
4. **Sessions do not rotate on privilege change** beyond being destroyed —
   which is the stronger behaviour, but means an affected user must sign in
   again.
5. **No automated dependency scanning** is wired up. Run `npm audit` in CI.

## Reporting a problem

Email the officer team (`tjhsstpolicy1@gmail.com`) or open an issue. Please do
not post details of an authentication or authorization flaw publicly before the
officers have had a chance to fix it.
