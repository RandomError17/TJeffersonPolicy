# Content review

Everything factual on this site came out of the previous
`JeffersonPolicy-main` archive. Nothing about the team was invented. This file
lists the places where the source material was **contradictory, undated, or
unverifiable**, so a human can decide rather than have a guess baked in.

Each item names where the value lives now.

---

## 1. Two different Discord invites — needs a decision

The archive contains two:

| Invite                          | Where it appeared             |
| ------------------------------- | ----------------------------- |
| `https://discord.gg/Mw8Vfu7RpD` | `views/partials/footer.ejs`   |
| `https://discord.gg/MzPaDcpMu`  | `views/resources.ejs`         |

The footer link is used, because it appeared on every page. Confirm which
server is current — one of these may be dead, and Discord invites expire.

**Where to fix:** Officer dashboard → Club settings → `social.discord`.

---

## 2. A second contact address — probably obsolete

`views/contact.ejs` says to email **`contact@tjpolicy.com`**, while every other
page uses **`tjhsstpolicy1@gmail.com`**. That contact page was not linked from
the navigation — `/socials` had replaced it — so `contact@tjpolicy.com` is
treated as obsolete and is not used anywhere in this site.

Confirm the domain is not in use before letting it lapse entirely.

**Where to fix:** Officer dashboard → Club settings → `club.email`.

---

## 3. "50+ debaters" and "10+ tournaments a year" — unverifiable claims

The old home page published both figures. They are carried forward because they
are the team's own published numbers, not because this application measured
anything. They are round, undated, and shown to prospective students and
parents.

Check them against the actual roster each season. Once enough members have
signed in, the officer dashboard shows a real count that can replace the claim.

**Where to fix:** Officer dashboard → Club settings → `figures.activeDebaters`,
`figures.tournamentsPerYear`.

---

## 4. Competitive claims without specifics — resolved by omission

The old site said the team had "earned TOC bids, won at VHSLs, and placed at
NCFL nationals", and that it had "at times... been one of the best teams in the
nation". No tournament, year, or debater was named anywhere in the archive.

**These claims are not reproduced on the new site**, and the achievements table
ships empty. Inventing a placement to fill the page would have been the one
thing the brief rules out absolutely. The public achievements page says plainly
that officers enter results as they happen.

**What to do:** add rows to the `Achievement` table directly — there is
currently no officer-dashboard form for this by request; the team decided
managing it as a page in the admin app wasn't worth the surface area for now.
The public page (season timeline, level filters, derived counts) reads
straight from that table, so it will look substantial the moment it has real
rows, however they get there. If a dashboard editor is wanted later, the
service layer (`lib/services/achievements.ts`) and the schema are already in
place — only the admin pages and API routes (removed) would need rebuilding.

---

## 5. Officer roster — 2025–26, needs re-election update

Transcribed verbatim from `views/officers.ejs`:

| Name                  | Position               |
| --------------------- | ---------------------- |
| Sanat Seth            | Captain                |
| Siddharth Surapaneni  | Captain                |
| Prady Chivukula       | Teaching Coordinator   |
| Siddarth Sankar       | Teaching Coordinator   |
| Ritham Reddy          | Webmaster / Publicist  |
| Akshay Chapuri        | Treasurer              |

The public officers page uses this list **only until officer profiles exist in
the database**; the first profile created takes over completely. The personal
email addresses shown are the ones already published on the old site — confirm
each officer still wants theirs public.

Note the two similar names, **Siddharth Surapaneni** and **Siddarth Sankar**,
spelled differently in the source. Both spellings are preserved as written;
check them.

**Where to fix:** Officer dashboard → Officer team.

---

## 6. Constitution PDF — dated 2025-09-08

Republished at `/docs/constitution.pdf` from
`static/images/Constitution-2025-09-08.pdf`. Linked from the About page.
Replace the file if the constitution has been amended since.

---

## 7. Ion activity IDs — verify each September

From the old home page:

- Varsity, Wednesday B block — activity **126**
- Novice, Friday A block — activity **279**

Activity IDs and blocks can change year to year. These are used on the home,
about, and join pages.

**Where to fix:** `lib/content/club.ts` → `MEETINGS`.

---

## 8. Google Calendar and lecture slides — check sharing

The old site embedded a Google Calendar for `tjhsstpolicy1@gmail.com` and a
Drive folder of lecture slides (`1vw8WisSrtpeGMjUWZSj91M-VVN1ycArO`). Both are
carried over as links rather than embeds. Confirm the sharing settings still
match who should see them.

**Where to fix:** Officer dashboard → Club settings → `links.calendarEmbed`,
`links.lectureSlides`.

---

## 9. Team photograph

The hero and about pages use the team photograph from the archive
(`static/images/team.svg`, a vector trace), rasterised and compressed to
`public/brand/team.jpg` — 6.8 MB down to 233 KB. It shows identifiable students.
It was already published on the team's own public site, but confirm everyone
pictured is still comfortable with that, and replace it when there is a newer
squad photo.

---

## 10. Demo records — delete before launch

`npm run db:seed:dev` creates accounts and records prefixed `[Sample]` so the
portal and dashboard can be exercised. **Never run it against production.** If
it was run by accident, every sample record is findable by that prefix.

The production seed (`npm run db:seed`) writes only club settings and the
starter order catalogue.
