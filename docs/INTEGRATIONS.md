# External integrations

What was investigated, what is actually possible, and what this application
therefore does. Findings were verified against the live services on
**2026-09-07**.

Summary:

| Service        | Real integration?          | Status in this app                             |
| -------------- | -------------------------- | ---------------------------------------------- |
| TJ Ion         | **Yes** — OAuth 2.0        | Implemented. Needs credentials to switch on.   |
| Tabroom        | **Partly** — one public JSON endpoint | Implemented, read-only, officer-initiated. |
| openCaselist   | **No** — per-user auth only | Deep links only, by decision. Adapter seam left in place. |
| MySchoolBucks  | **No** — payment processor  | Outbound links only, by design.                |
| NSDA           | **No** — no public API      | Outbound links; membership status tracked manually. |

---

## TJ Ion — implemented

Ion runs [django-oauth-toolkit](https://ion.readthedocs.io/en/latest/developing/oauth.html)
and exposes a standard authorization-code flow. Verified endpoints:

```
authorize  https://ion.tjhsst.edu/oauth/authorize/
token      https://ion.tjhsst.edu/oauth/token/
profile    https://ion.tjhsst.edu/api/profile      (Bearer, scope "read")
```

`GET https://ion.tjhsst.edu/api/` returns a live index of the API, and
`/api/profile` returns 401 without a token, as expected. There is no OIDC
discovery document — this is plain OAuth 2.0.

**What the profile gives us.** From the serializer in
[`tjcsl/ion`](https://github.com/tjcsl/ion): `ion_username`, `id`,
`display_name`, `first_name`, `last_name`, `user_type`, `graduation_year`,
`tj_email`, and `grade: { number, name }`. Sensitive fields (address, phone
numbers, personal emails, absence counts) are stripped by Ion itself before the
response is sent.

**Verifying a TJ student.** `user_type` is authoritative. This app accepts
`student`, `teacher`, and `counselor`; anything else (service accounts) is
refused with a clear message. `grade.number` is 9–12 for students and 13 for
staff, so staff values are discarded rather than stored as a grade.

### Turning it on

Everything below the redirect is already built and verified. The only thing
this application cannot do for itself is register with Ion, because that needs
an Ion login.

**1. Register the application** at <https://ion.tjhsst.edu/oauth/applications/>

| Field            | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Name**         | `TJ Policy Debate` — this is the name Ion shows on its consent screen, so make it the one students should recognise |
| **Client type**  | Confidential                                                    |
| **Grant type**   | Authorization code                                              |
| **Redirect URI** | `https://your-domain/api/auth/callback` — exact, no trailing slash |

Ion accepts more than one redirect URI, whitespace-separated. Adding
`http://localhost:3000/api/auth/callback` on the same application lets sign-in
be tested locally. If Ion rejects a plain-http localhost URI, register only the
production URL and test there.

Ion's consent screen will say *"This application is not sanctioned by Ion"* —
that is what it shows for every third-party application, not a misconfiguration.

**2. Set the environment**

```
AUTH_PROVIDER=ion
ION_CLIENT_ID=<from the registration>
ION_CLIENT_SECRET=<from the registration>
APP_URL=https://your-domain
OFFICER_USERNAMES=2028rreddy,2028achapuri,2028pchivuku,2028ssankar,2028ssurapan,2028sseth
```

**3. Restart.** Nothing else changes. The callback, session handling, and
account provisioning are already the production path — the development provider
posts to the same route handler, so that code is exercised either way.

Verified against a production-mode server: `/api/auth/login` redirects to

```
https://ion.tjhsst.edu/oauth/authorize/
  ?client_id=…&response_type=code
  &redirect_uri=https%3A%2F%2Fyour-domain%2Fapi%2Fauth%2Fcallback
  &scope=read&state=…&code_challenge=…&code_challenge_method=S256
```

and `/auth/dev` returns 404 as soon as `AUTH_PROVIDER` is not `dev`.

### Who becomes an officer

Ion has no concept of a debate officer, so the role is decided here.

`OFFICER_USERNAMES` is a **standing list**, not a one-time bootstrap. It is
re-applied on every sign-in, which means:

- Adding a username grants officer access at that person's next sign-in, even
  if they already have a member account.
- It only ever promotes. Someone the dashboard promoted keeps their role
  whether or not they are listed, and signing in never demotes anyone.
- Because the list wins, the dashboard **refuses** to demote someone on it,
  explaining that the change would revert — remove them from the setting first.
  Their profile can still be taken off the public officers page.

Officers added later do not need an environment change; promote them from
Officer team in the dashboard. Every role change is written to the audit log.

### What this app deliberately does not do

- **No Ion password ever touches this site.** Sign-in happens on
  ion.tjhsst.edu. There is no password field anywhere in this codebase.
- **No Ion-branded fake login.** The development provider is a plain account
  picker at `/auth/dev` with a banner saying what it is. It refuses to load
  unless `AUTH_PROVIDER=dev`, which `lib/env.ts` refuses to accept in
  production, which `DevAuthProvider`'s constructor refuses to instantiate
  under `NODE_ENV=production`. Three independent checks.
- **No token retention.** The access token is used once, to read the profile,
  and then discarded. No refresh token is stored. There is nothing in the
  database that could be replayed against Ion.
- **No profile photographs.** Ion's picture endpoint requires an authenticated
  request, and republishing students' yearbook photos is not something a club
  site should do by default. Monogram avatars are used instead; officers may
  set their own public photo URL.

PKCE (S256) is sent by default and can be disabled with `ION_USE_PKCE=false` if
Ion's configuration ever rejects it.

---

## Tabroom — implemented, read-only

**There is no documented public Tabroom API and no OAuth.** There is one
unauthenticated JSON endpoint that serves a tournament's public backup:

```
GET https://www.tabroom.com/api/download_data.mhtml?tourn_id=<id>
```

Verified live: it returns the tournament's `name`, `webname`, `start`, `end`,
`reg_start`, `reg_end`, `city`, `state`, `country`, `timezone`, and a
`categories[].events[]` tree with event names, abbreviations, types, and fees.
It also returns entry lists, judges, schools, and results.

### What this app does with it

`lib/integrations/tabroom.ts` implements an officer-initiated, one-tournament-
at-a-time, rate-limited, **metadata-only** import. An officer pastes a Tabroom
link (or the bare `tourn_id`) into the tournament form and the scheduling
fields and event list are filled in for review. Nothing is written until the
officer saves.

`extractTournamentMetadata` reads the scheduling fields and the event list and
drops everything else. This application has no reason to hold the names of
minors from other schools, so it does not store them — there is a test that
asserts the extracted object contains no entry data.

### What it does not do

No automated entry, no credentialed access, no HTML scraping, no background
polling. **Registering the squad on Tabroom stays a manual officer task.** A
tournament record keeps its `tabroomUrl` so officers and members reach the real
page in one click.

The UI never depends on this succeeding. Every Tabroom failure surfaces as an
explanation next to a form the officer can simply fill in by hand, and the
whole feature can be switched off with `TABROOM_IMPORT_ENABLED=false`.

**Known limit:** subdomain-style links (`https://<webname>.tabroom.com`) carry
no `tourn_id`. Rather than guess, the app explains where to find the numeric id.

**Stability caveat:** this endpoint is public but undocumented, so Tabroom may
change or withdraw it without notice. That is exactly why it is a convenience
layered over manual entry and not a dependency.

---

## openCaselist — deep links only, by decision

openCaselist **does** run a real REST API. Its OpenAPI document is public at
<https://api.opencaselist.com/v1/docs> and describes 24 routes covering
caselists, schools, teams, rounds, cites, and open-evidence downloads.

We are not calling it. The spec declares exactly one security scheme:

```yaml
security: [{ cookie: [] }]
securitySchemes:
  cookie: { type: apiKey, in: cookie, name: caselist_token }
```

That cookie is issued by `POST /login`, which authenticates against **Tabroom's
credential store**. Every route is behind it, including `/search` and
`/openev` — there is no service token, no client-credentials grant, and no
anonymous read tier.

Integrating server-side would therefore mean collecting and replaying our
members' Tabroom passwords. That is precisely the thing this project refuses to
do for Ion, and it is no more acceptable here. Storing one shared officer login
instead would attribute every member's activity to that officer and put their
credentials in our database — also refused.

**So: deep links.** Members reach openCaselist already signed in as themselves,
in their own browser, with their own permissions. `lib/integrations/opencaselist.ts`
builds correct URLs (including the season's caselist slug, e.g. `hspolicy27`)
and performs no requests. The `OpenCaselistAdapter` interface is left in place
as the seam a future authenticated integration would implement; it is
intentionally unimplemented rather than stubbed with fabricated results.

---

## MySchoolBucks and the NSDA — links only

MySchoolBucks (Heartland) is the payment processor FCPS uses. It has no public
integration API for a club site, and there is no version of this application
that should be nearer to a card number than a hyperlink.

**This application is the tracking layer, not the payment processor.** Members
pay in MySchoolBucks; officers record the outcome here. The schema contains no
column that could hold a card number, bank detail, or processor token, and no
endpoint accepts one.

Store URLs vary per school and per item, so the link is a club setting
(`links.myschoolbucks`) plus an optional per-item `externalUrl` — both editable
from the officer dashboard.

NSDA membership works the same way: members join through the school or the
NSDA, and an officer records the status. There is no NSDA API in use.
