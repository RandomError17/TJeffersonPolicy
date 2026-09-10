"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Scroll-triggered entrance.
 *
 * The reveal is driven by a data attribute rather than React state: the
 * observer's job is to poke the DOM once, and routing that through a render
 * pass would buy nothing. The styling lives in app/globals.css under
 * `[data-reveal]`.
 *
 * Three rules make this safe rather than decorative-at-any-cost:
 *  1. When the visitor prefers reduced motion, children are revealed
 *     immediately — never hidden, never faded.
 *  2. If IntersectionObserver is unavailable, content shows. The failure mode
 *     of an animation helper must be "visible", not "blank page".
 *  3. A <noscript> rule in app/layout.tsx forces every [data-reveal] visible,
 *     so a visitor with scripting disabled gets the page without the
 *     animation rather than a page of empty sections.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reveal = () => {
      node.dataset.revealed = "true";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} data-reveal="" className={cn(className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}
