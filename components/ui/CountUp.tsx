"use client";

import { useEffect, useRef } from "react";

/**
 * Counts a statistic up when it scrolls into view.
 *
 * The final value is what renders on the server, and the animation overwrites
 * it from an effect. That ordering matters: with JavaScript disabled, or before
 * hydration, the reader sees the real number rather than a zero.
 *
 * `value` may be a plain number or a string like "50+" — the numeric part is
 * animated and any suffix is preserved, so the figures carried over from the
 * old site ("50+", "10+") stay exactly as written.
 */
export function CountUp({ value, durationMs = 1100 }: { value: string | number; durationMs?: number }) {
  const text = String(value);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = numberRef.current;
    if (!node) return;

    const match = /^(\D*)(\d[\d,]*)(.*)$/.exec(text);
    if (!match) return;

    const prefix = match[1];
    const target = Number.parseInt(match[2].replace(/,/g, ""), 10);
    const suffix = match[3];
    if (!Number.isFinite(target)) return;

    // Nothing to animate towards, and no reason to blank the value first.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      return;
    }

    const render = (n: number, withSuffix: boolean) => {
      node.textContent = `${prefix}${n.toLocaleString("en-US")}${withSuffix ? suffix : ""}`;
    };

    render(0, false);

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs);
          // Ease-out cubic, close enough to --ease-out-soft.
          const eased = 1 - Math.pow(1 - progress, 3);
          render(Math.round(target * eased), progress >= 1);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, durationMs]);

  return (
    <span>
      {/* The animated span is hidden from assistive tech; the value beside it
          is always the real one, mid-count or not. */}
      <span ref={numberRef} aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
