"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "tjpd_cookie_notice_ack";
/** Fired on dismissal so this tab updates; `storage` only fires in other tabs. */
const ACK_EVENT = "tjpd:cookie-ack";

/** Pages that already are the call to action, plus the sign-in route. */
const CTA_HIDDEN_ON = ["/join", "/contact", "/signin"];

/**
 * The two fixed bars that live at the bottom of the public site.
 *
 * They share a file because they share a corner of the screen: both are
 * `position: fixed; bottom: 0`, so whichever rendered second would sit on top
 * of the other. Rather than stacking them — which needs the notice's measured
 * height and still leaves a cramped two-deck footer on a phone — the join bar
 * waits until the notice has been acknowledged. One decision at a time.
 *
 * Both pieces of state live outside React (localStorage, window scroll), so
 * they are read through `useSyncExternalStore`. That is what it is for, and it
 * gives us the server/client split for free: the server snapshots below render
 * nothing, so the markup React hydrates always matches what the server sent.
 *
 * Whichever bar is fixed on screen also owns the in-flow spacer beneath the
 * footer that keeps the last row of footer links from sitting under it. The
 * spacer's height is measured off the real bar via `ResizeObserver` rather
 * than hardcoded, because the cookie notice's height is not fixed — its
 * privacy sentence wraps to a different number of lines depending on viewport
 * width, so a constant reserved height (sized for the join bar) could leave
 * the notice covering footer content on first visit.
 *
 * The join bar also defers to any in-page section that is itself the same
 * call to action — see `[data-hides-sticky-join-bar]` below — so a page that
 * ends on its own "join" CTA does not show a second, floating one over it.
 * That visibility is read the same way as scroll position: synchronously
 * from the DOM, driven by the same scroll/resize subscription, rather than a
 * separate IntersectionObserver — one less thing to keep in sync on
 * navigation, since a fresh render (pathname changed) re-runs the snapshot
 * against whatever is actually in the DOM now.
 */
export function BottomBars() {
  const pathname = usePathname();
  const acknowledged = useSyncExternalStore(subscribeToAck, getAckSnapshot, getAckServerSnapshot);
  const scrolledPastHero = useSyncExternalStore(subscribeToScroll, getScrollSnapshot, getScrollServerSnapshot);
  const ctaSectionVisible = useSyncExternalStore(subscribeToScroll, getCtaSectionSnapshot, getCtaSectionServerSnapshot);
  const barRef = useRef<HTMLDivElement>(null);
  // The join bar's own footprint (60px min-height + 4px top border) is a safe
  // default for the first paint, before ResizeObserver has measured anything.
  const [barHeight, setBarHeight] = useState(64);

  useLayoutEffect(() => {
    const node = barRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setBarHeight(entry.target.getBoundingClientRect().height));
    observer.observe(node);
    return () => observer.disconnect();
  });

  if (!acknowledged) {
    return (
      <>
        <Spacer height={barHeight} />
        <CookieNotice ref={barRef} />
      </>
    );
  }

  const ctaHidden = CTA_HIDDEN_ON.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (ctaHidden) return null;

  return (
    <>
      <Spacer height={barHeight} />
      <StickyJoinBar ref={barRef} shown={scrolledPastHero && !ctaSectionVisible} />
    </>
  );
}

function Spacer({ height }: { height: number }) {
  return <div className="lg:hidden print:hidden" style={{ height }} aria-hidden="true" />;
}

/* --------------------------------------------------------------- the stores */

function subscribeToAck(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(ACK_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(ACK_EVENT, onChange);
  };
}

function getAckSnapshot(): boolean {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private browsing and "block all cookies" make localStorage throw rather
    // than return null. Showing the notice again is the safe failure;
    // suppressing it forever is not.
    return false;
  }
}

/** Server render shows no notice, so there is nothing to mismatch on hydration. */
function getAckServerSnapshot(): boolean {
  return true;
}

function acknowledge() {
  try {
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // It reappears next visit. Acceptable; breaking the page is not.
  }
  window.dispatchEvent(new Event(ACK_EVENT));
}

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

/** Roughly one viewport down: past the hero on every public page. */
function getScrollSnapshot(): boolean {
  return window.scrollY > window.innerHeight * 0.8;
}

function getScrollServerSnapshot(): boolean {
  return false;
}

/** Whether the page's own final-CTA section (if it has one) is on screen. */
function getCtaSectionSnapshot(): boolean {
  const ctaSection = document.querySelector<HTMLElement>("[data-hides-sticky-join-bar]");
  if (!ctaSection) return false;
  const rect = ctaSection.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function getCtaSectionServerSnapshot(): boolean {
  return false;
}

/* --------------------------------------------------------------- the bars */

/**
 * Cookie notice — a disclosure, not a consent gate, and the difference is
 * deliberate.
 *
 * The site sets exactly two cookies, both strictly necessary: `tjpd_session`
 * (signs you in) and `tjpd_csrf` (blocks cross-site form forgery). Analytics
 * is Plausible, which sets no cookie and stores no device identifier. Under
 * GDPR/ePrivacy, strictly-necessary cookies need no consent — so Accept/Reject
 * buttons here would be theatre: "Reject" could not turn anything off without
 * breaking sign-in, and implying otherwise is worse than stating plainly what
 * is stored.
 *
 * If a tracking or advertising cookie is ever added, this must become a real
 * gate that withholds the script until the visitor opts in.
 */
const CookieNotice = forwardRef<HTMLDivElement>(function CookieNotice(_props, ref) {
  return (
    <div
      ref={ref}
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[70] border-t-4 border-signal bg-navy-900 print:hidden"
    >
      <div className="u-container flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between md:gap-10">
        <p className="max-w-3xl text-sm leading-relaxed text-white/80">
          This site uses two cookies, both needed to sign you in and keep that session secure. There are no advertising
          or tracking cookies, and our traffic analytics stores no cookie or device identifier.{" "}
          <Link
            href="/privacy"
            className="border-b-2 border-signal font-semibold text-white hover:bg-signal hover:text-ink"
          >
            Read the privacy policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={acknowledge}
          className="min-h-[48px] shrink-0 self-start border-2 border-ink bg-signal px-8 font-display text-xs font-bold uppercase tracking-[0.16em] text-ink transition-[transform,box-shadow] duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_0_var(--color-paper)] motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 md:self-auto"
        >
          Got it
        </button>
      </div>
    </div>
  );
});

/**
 * Persistent join bar on small screens. It slides in only once the hero has
 * scrolled away, so it never covers the hero's own primary CTA with a
 * duplicate of itself.
 */
const StickyJoinBar = forwardRef<HTMLDivElement, { shown: boolean }>(function StickyJoinBar({ shown }, ref) {
  return (
    <div
      ref={ref}
      className={[
        "fixed inset-x-0 bottom-0 z-[60] border-t-4 border-ink bg-signal lg:hidden print:hidden",
        "transition-transform duration-200 [transition-timing-function:var(--ease-out-soft)] motion-reduce:transition-none",
        shown ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
      // Hidden from assistive tech while off-screen so it is not announced as
      // a link that cannot be reached.
      aria-hidden={!shown}
    >
      <Link
        href="/join"
        tabIndex={shown ? undefined : -1}
        className="flex min-h-[60px] items-center justify-center gap-3 px-6 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink"
      >
        Join the team
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
});
