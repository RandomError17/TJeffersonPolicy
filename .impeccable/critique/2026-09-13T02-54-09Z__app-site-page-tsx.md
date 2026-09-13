---
target: the homepage
total_score: 23
max_score: 28
na_heuristics: 5,7,10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/rithamreddy/Documents/tj-policy-debate/TJeffersonPolicy/app/(site)/page.tsx"
target_fingerprint: "sha256:ced8edca59a8ac61872ea91bfd87c1e56a24b6604fc87dc7f42a786a9f70e00d"
target_path: /Users/rithamreddy/Documents/tj-policy-debate/TJeffersonPolicy/app/(site)/page.tsx
timestamp: 2026-09-13T02-54-09Z
slug: app-site-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Header transitions transparent→navy on scroll, active nav underline — solid, unremarkable |
| 2 | Match Between System & Real World | 3 | Debate-authentic vocabulary (WASDL, VHSL, TOC, NCFL) is correct but unexplained for outside visitors |
| 3 | User Control and Freedom | 3 | No traps; cookie notice dismissible; standard nav |
| 4 | Consistency and Standards | 3 | The system's own "amber = CTA only" rule is stretched by a full-bleed amber section |
| 5 | Error Prevention | n/a | No forms/user input on the homepage itself |
| 6 | Recognition Rather Than Recall | 4 | Verb-labeled CTAs throughout, no icon-only affordances |
| 7 | Flexibility and Efficiency of Use | n/a | Marketing page — no repeat-use accelerators apply |
| 8 | Aesthetic and Minimalist Design | 3 | "Join" CTA appears 4x in one scroll — defensible, but it's repetition |
| 9 | Error Recovery | 4 | Zero-achievements and zero-news states both get a real designed EmptyState |
| 10 | Help and Documentation | n/a | No in-page task complex enough to need it |
| **Total** | | **23/28** | **Good (82%)** |

## Design Specificity Verdict

Mixed, leaning specific. Navy drawn from the team's actual seal, MEETINGS links real Ion activity IDs, SEASON_PHASES names real regional structures (WASDL, VHSL, TOC, NCFL), results section driven by live DB data. POLICY_EXPLAINER's four cards describe policy debate generically — reusable by any team. Page skeleton is a generic landing-page pattern. Differentiation lives in tokens and data, not IA.

Deterministic scan: CLI detector flagged 3 `side-tab` findings (page.tsx:83, States.tsx:96, SiteFooter.tsx:60) — all false positives, one documented token-driven motif reused consistently, not unrelated one-off tells.

Visual overlays: unavailable this session (no browser automation tool, no running dev server).

## What's Working

1. Amber-as-CTA-only enforced correctly under a real edge case: final CTA section background is amber, primary button correctly swaps to navy instead of amber-on-amber.
2. Empty states treated as real states: zero-achievements and zero-news both render a designed EmptyState with explanatory copy and redirect CTA.
3. Reduced-motion and no-JS handled through three independent layers (Reveal.tsx JS check, CSS media query, noscript fallback).

## Priority Issues

**[P1] Above-the-fold hero content can render blank until JS hydrates** — Hero is wrapped in `<Reveal>` (page.tsx:62-116), which defaults to opacity:0 at first paint (globals.css:625-631) until JS mounts and observes. On slow hydration, the hero can sit blank for a perceptible window. Fix: don't wrap above-the-fold hero content in Reveal; reserve reveals for below-the-fold content. Suggested: /impeccable optimize

**[P1] Mobile layout bug: footer spacer sized for the wrong element on first visit** — layout.tsx:24-26 reserves a 64px spacer sized for the join bar, but the (likely taller) CookieNotice renders in that slot on first visit (BottomBars.tsx:112-141), so footer links can be covered on narrow viewports. Fix: size the spacer to the taller of the two possible states. Suggested: /impeccable adapt

**[P2] Sticky mobile "Join" bar overlaps the page's own dedicated CTA section** — BottomBars.tsx excludes the sticky join bar only on /join, /contact, /signin — not the homepage — so it floats over the homepage's own final CTA section (page.tsx:345-363). Fix: hide the sticky bar once the in-page final CTA scrolls into view. Suggested: /impeccable distill

**[P2] Animated counter lends false precision to a stat flagged as unverified in the code itself** — PUBLISHED_FIGURES ("50+","10+") documented as unmeasured and NEEDS REVIEW each season (lib/content/club.ts:88-96), yet rendered with full CountUp animation at 36-48px next to the headline. Fix: drop the animation for these two figures or add a visible qualifier. Suggested: /impeccable clarify

**[P2] Hero stat block mobile wrap risk + footer text sits at the AA contrast floor** — 3-col stat grid has no breakpoint fallback unlike every other grid on the page; 10px uppercase labels risk wrapping on narrow phones. Footer text (white/45 on navy-950) computes to ~4.56:1, just over AA with no margin. Fix: add mobile grid-cols-1 fallback, raise label size floor, bump footer text opacity. Suggested: /impeccable audit

## Persona Red Flags

**Jordan (confused first-timer/parent):** Hero photo dimmed to opacity-[0.18] and desaturated — may not register as a real photo of real students. "Sign up on Ion ↗" links to TJ-internal SSO with no note it's TJ-students-only. Season section uses four unexplained acronyms (WASDL, VHSL, TOC, NCFL) with no glossary.

**Casey (distracted mobile user):** Must dismiss cookie notice (which may cover footer links, see P1). Sticky join bar still floats over the homepage's own dedicated join CTA section — two overlapping join prompts in the same viewport.

**Riley (edge-case stress tester):** Zero-achievements/zero-news handled gracefully. 1-2 published news posts breaks the unconditional md:grid-cols-3 news grid into a lopsided layout.

## Minor Observations

- CLUB.wordmark exists but hero hardcodes the three-line split directly in JSX rather than deriving from it.
- Footer nav columns use redundant `<h2>` given each `<nav>` already has aria-label.
- Ion links open in new tab with correct rel attributes but no screen-reader "opens in new tab" announcement.
- News grid partial-fill (1-2 posts) produces a lopsided layout — low severity.
- Skip-to-content link and heading hierarchy (h1→h2→h3, no skipped levels) implemented correctly.

## Questions to Consider

- Should the 60/30/10 amber rule get an explicit carve-out for section-level emphasis, given the final CTA section already stretches it?
- Has an officer actually been asked for this season's real membership/tournament numbers, or has NEEDS REVIEW quietly outlived its deadline?
- Is there a version of the policy-explainer section that answers "why debate at TJ specifically" instead of the generic activity primer?
