---
target: the homepage
total_score: 25
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/rithamreddy/Documents/tj-policy-debate/TJeffersonPolicy/app/(site)/page.tsx"
target_fingerprint: "sha256:1b11d6ce77a814a63f65be19fb06c375d94e41b48db7e2097d9b4d4079e1c4dc"
target_path: /Users/rithamreddy/Documents/tj-policy-debate/TJeffersonPolicy/app/(site)/page.tsx
timestamp: 2026-09-13T03-10-12Z
slug: app-site-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Header transitions transparent→solid on scroll, active nav marked; no scroll-progress indicator (not essential here) |
| 2 | Match Between System & Real World | 4 | Authentic debate vocabulary throughout, correctly used |
| 3 | User Control and Freedom | 3 | Mobile nav handles Escape/refocus; cookie notice offers no reject, but that's a deliberate, documented legal choice |
| 4 | Consistency and Standards | 2 | The system's own "amber = CTA only" rule is used decoratively in 5+ places on this page alone (see P1) |
| 5 | Error Prevention | n/a | No forms/input on the homepage |
| 6 | Recognition Rather Than Recall | 4 | Footer fully mirrors header nav |
| 7 | Flexibility and Efficiency of Use | 3 | No power-user shortcuts needed; portal/sign-in reachable from anywhere |
| 8 | Aesthetic and Minimalist Design | 3 | Visually maximalist by design, but copy per section is restrained |
| 9 | Error Recovery | n/a | No error states possible on this page |
| 10 | Help and Documentation | 3 | No inline help, but Contact/Officers one click away |
| **Total** | | **25/32** | **Good (78%)** |

(Different applicable heuristic set than the previous run — this run scored #7 and #10 concretely rather than n/a, and marked #9 n/a instead of #4 — so 25/32 is not directly comparable to the prior 23/28; see the trend line below.)

## Design Specificity Verdict

Reaffirmed pass, with more evidence this round: the hero headline spells the team's name as a poster, meeting cards link to real Ion eighth-period activity URLs, the season timeline names real circuit events (WASDL, VHSL Districts, TOC, NCFL), and navy is sourced from the team's actual seal. This could not be dropped into an unrelated club unchanged.

Deterministic scan: same 3 `side-tab` findings as the prior run (page.tsx:82, SiteFooter.tsx:60, States.tsx:96) — both independent review rounds judge these false positives: a repeated, systematized motif consistent with the documented constructivist language, not ad-hoc slop.

Visual overlays: unavailable this session (no browser automation tool, no running dev server).

## What's Working

1. Content-honesty engineering is real, not just policy: CountUp only animates the one genuinely-measured figure (MEETINGS.length); the two officer-published approximate figures render static, with the reasoning spelled out in code comments.
2. Triple-redundant motion safety: Reveal and CountUp both independently handle prefers-reduced-motion and missing IntersectionObserver, backed by a noscript fallback.
3. Empty states are honest, not fake: zero achievements/news both render a purpose-built EmptyState with a working next-step CTA.

## Priority Issues

**[P1] Amber is used well beyond the design system's own "CTA only" rule** — The documented rule: amber is reserved only for calls to action, anything else is a bug. In practice on this page: the eyebrow tick-mark (`.c-label::before`, globals.css:223-229) fires 5 times, none clickable; the achievement level pill (`page.tsx:175`) is a status label, not a click target; the hero logo's `border-2 border-signal` (`page.tsx:66`) is purely decorative; `.c-rule-signal` is a plain structural stripe with no click affordance. By the time a visitor reaches the actual "Join the team" button, amber has already done non-clickable work five-plus times, diluting the exact signal the palette is built around. Fix: either relax the documented rule to explicitly cover brand-accent uses, or move decorative amber to a muted navy/rule tone so amber stays exclusively load-bearing. Suggested: /impeccable colorize

**[P1] Sticky mobile join bar can collide with the hero's own CTA at the top** — BottomBars.tsx treats "past the hero" as `scrollY > innerHeight * 0.8`, a fixed viewport proportion, not a measurement of the actual hero. The hero is `min-h-[92svh]` plus stacked mobile content (headline, paragraph, 2 buttons, a 3-row stat block once it collapses to grid-cols-1), so on a short/narrow phone real hero height can exceed 100vh — the sticky bar can appear while the hero's own "Join the team" button is still on screen, the same redundant-CTA problem already solved for at the bottom of the page via `data-hides-sticky-join-bar`, but with no equivalent guard at the top. Fix: give the hero the same kind of measured/marked guard instead of a fixed viewport-height heuristic. Suggested: /impeccable adapt

**[P2] Unverified stats still carry no visible honesty cue to the visitor** — "Active debaters" and "Tournaments a year" render as flat static text in the identical 4xl/5xl weight as the real, animated "Weekly meetings" count; the only differentiators are the trailing "+" and non-animation, neither a legible signal to a visitor that these are approximate legacy figures. The content-honesty fix now lives correctly in the code but doesn't yet reach the reader. Fix: add a shared caption near the stat block noting these are approximate published figures. Suggested: /impeccable clarify

**[P3] Hero intentionally skips the reveal-sequencing the rest of the page relies on** — Every section below the hero staggers children in via Reveal delays; the hero renders all at once by design for perceived-performance reasons. Correct tradeoff, but it's the page's one "one thing at a time" violation and the highest-stakes screen. No action required unless the tradeoff is revisited.

**[P3] Header nav exceeds the ≤4-choice guidance** — Desktop header shows 5 nav links plus Sign in plus Join = 7 simultaneous top-level targets. Standard for a small site's chrome, not a real complaint, but the one clear violation of the choice-count rule on a page that otherwise respects it everywhere else.

## Persona Red Flags

**Jordan (confused first-timer/parent):** Sees "50+ active debaters" and "10+ tournaments a year" with the same visual confidence as a real number, no way to know these are legacy figures. If achievements are unseeded, hits "Results are being compiled" right after being told the program is large — individually honest, together can read as "big team, no visible track record yet."

**Casey (distracted mobile user):** On a short/narrow phone, the sticky join bar may appear while the hero's own "Join the team" button is still on screen (see P1) — the exact duplication the codebase explicitly solved for at the bottom, unguarded at the top.

**Riley (edge-case stress tester):** Empty achievements/news both degrade gracefully. Worth flagging to officers (not visitors): "Active debaters"/"Tournaments a year" are DB-backed and officer-editable via settings, while "Weekly meetings" is derived from a hardcoded array in lib/content/club.ts — two of three headline stats are runtime-editable, one requires a code change, invisible from the admin side.

## Minor Observations

- CountUp's only real target (MEETINGS.length = 2) animates 0→2 over 1100ms — essentially imperceptible; the one number that gets the flashy treatment is also the least dramatic, by design.
- Hero photo `alt=""` is correct per WCAG for decorative use, but means screen-reader users get no benefit from what's meant to be an emotionally resonant real team photo.
- The final CTA section's entire background is amber, so its own button has to switch to navy (`solid` variant) to stay visible against it — clever adaptation, but the site's most amber-saturated real estate isn't itself clickable, a mild paradox against the "amber = click here" association built everywhere else.

## Questions to Consider

- If amber is genuinely sacred to "click here," why does the shared component library spend it freely on things nobody can click — has the rule quietly become "decorative-with-benefits," and should it be rewritten to match what's actually shipped?
- Is hiding the honesty distinction in "did this number animate" actually serving a visitor, or is it an internal engineering nicety nobody outside the codebase will notice?
- Should the sticky mobile join bar be anchored to the hero's own measured bottom edge — the way the closing CTA band already is — instead of a fixed 80%-of-viewport proxy?
