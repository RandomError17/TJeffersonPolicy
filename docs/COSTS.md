# Cost controls

A club site should never be able to generate a bill nobody approved. Vercel and
Neon both default to *usage-based* pricing, which means a traffic spike, a
crawler loop, or a runaway query can cost real money unless a ceiling is set.

**Nothing in this repository can set that ceiling.** Spend limits live in the
hosting account, behind the account owner's login. The steps below have to be
done by hand, once, by whoever owns the Vercel and Neon accounts.

---

## 1. Vercel — hard spend cap

Vercel's Spend Management can do two different things. Only one of them is a
real cap.

1. Open <https://vercel.com/dashboard> and select the **team/account** that owns
   the project (not the project itself).
2. **Settings → Billing → Spend Management**.
3. Set an **Amount** — the monthly dollar figure you are willing to reach. For a
   club site on Hobby/Pro, something like `$10` above the plan fee is generous.
4. Turn on **Pause Production Deployment** for that amount.

   This is the part that matters. Without it, the amount is only a
   *notification* threshold: you get an email and the meter keeps running. With
   it, Vercel takes the production deployment offline when the figure is hit.
5. Add a notification email (and a second one, if another officer should know).

> **Understand the trade-off before enabling the pause.** When it trips, the
> site goes down — members cannot register for tournaments until someone raises
> the limit. That is the correct behaviour for a student club with no budget,
> but it is a deliberate choice, not a free safety net. Set the amount high
> enough that only a genuine runaway triggers it.

### Also worth setting

- **Settings → Billing → Invoices**: confirm a payment method the club actually
  controls, not a personal card that silently renews after someone graduates.
- **Project → Settings → Functions**: leave the default max duration. Raising it
  raises the worst-case bill.
- **Project → Settings → Deployment Protection**: consider protecting preview
  deployments so crawlers cannot run up function invocations against them.

## 2. Neon — database ceiling

The database is separate billing and has its own runaway modes.

1. Open <https://console.neon.tech> → your project.
2. **Settings → Billing** (or the project's **Usage** panel) and review the
   plan's included compute hours and storage.
3. Set **autoscaling max compute** to the smallest size that serves the site —
   this site's queries are small and indexed, so the floor is almost certainly
   enough. The max compute size is the single biggest lever on cost.
4. Enable **scale to zero** (suspend after inactivity). A club site is idle most
   of the day and this is where most of the saving is.
5. Turn on billing alerts if the plan offers them.

## 3. What the application already does to stay cheap

These are properties of the code, not settings, and are worth preserving:

- **No polling.** Nothing in the client refetches on a timer, so an idle open
  tab costs nothing.
- **`robots.txt` disallows `/portal`, `/admin`, `/api`** — crawlers cannot walk
  the authenticated, database-heavy half of the site.
- **The sitemap is cached for an hour** (`revalidate = 3600` in `app/sitemap.ts`)
  rather than querying on every crawler hit.
- **Analytics is cookieless and external.** It adds no database load.
- **No image uploads, no object storage, no background jobs** — the three things
  that usually turn a small site into a surprising invoice.

## 4. A quick monthly check

Once a month, ideally at an officer handover:

- Vercel → Usage: is anything trending up that shouldn't be?
- Neon → Usage: is compute time growing faster than the squad?
- Confirm the spend cap and the payment method still belong to someone currently
  on the team.

---

*Last reviewed: 12 September 2026. If Vercel or Neon reorganise their dashboards,
the concepts above still apply even when the menu names drift — look for "spend",
"usage", "budget", or "limits".*
