"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/about", label: "About" },
  { href: "/officers", label: "Officers" },
  { href: "/achievements", label: "Record" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Site header.
 *
 * On pages with a dark hero it starts transparent and becomes a solid navy bar
 * once the hero is behind it. `transparentUntilScroll` is set by the page
 * rather than sniffed, so a page without a hero never renders white-on-white.
 *
 * The active link is marked with a signal bar underneath rather than a colour
 * change, keeping amber's meaning ("this is the thing to act on") intact while
 * still reading clearly.
 */
export function SiteHeader({
  transparentUntilScroll = false,
  signedIn = false,
  isOfficer = false,
}: {
  transparentUntilScroll?: boolean;
  signedIn?: boolean;
  isOfficer?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  /*
    Scroll position is state owned by the browser, not by React, so it is read
    through useSyncExternalStore rather than mirrored into a useState inside an
    effect. The server snapshot returns the un-scrolled value, which matches
    what the page renders before hydration.
  */
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("scroll", onChange, { passive: true });
    return () => window.removeEventListener("scroll", onChange);
  }, []);

  const scrolled = useSyncExternalStore(
    subscribe,
    () => !transparentUntilScroll || window.scrollY > 40,
    () => !transparentUntilScroll,
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-200",
        solid ? "border-b-2 border-signal bg-navy-900" : "border-b-2 border-transparent bg-transparent",
      )}
      style={{ minHeight: "var(--header-height)" }}
    >
      <nav aria-label="Main" className="u-container flex h-[var(--header-height)] items-center gap-8">
        <Link href="/" className="group flex shrink-0 items-center gap-3.5" aria-label="TJ Policy Debate — home">
          <span className="flex h-11 w-11 items-center justify-center border-2 border-white/25 bg-white/5 transition-colors group-hover:border-signal">
            <Image src="/brand/logo.svg" alt="" width={28} height={28} className="h-7 w-7" priority />
          </span>
          <span className="font-display text-sm font-extrabold uppercase leading-[1.05] tracking-[0.02em] text-white">
            TJ Policy
            <span className="block text-signal">Debate</span>
          </span>
        </Link>

        <ul className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="relative block px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white/75 transition-colors hover:text-white"
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-4 bottom-1.5 h-[3px] origin-left bg-signal transition-transform duration-200",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <Link
            href={signedIn ? (isOfficer ? "/admin" : "/portal") : "/signin"}
            className="hidden px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white/75 transition-colors hover:text-white sm:block"
          >
            {signedIn ? (isOfficer ? "Dashboard" : "Portal") : "Sign in"}
          </Link>
          <Link
            href="/join"
            className="hidden border-2 border-ink bg-signal px-6 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink transition-transform duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[4px_4px_0_0_#fff] motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 sm:block"
          >
            Join
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-12 w-12 items-center justify-center border-2 border-white/30 text-white transition-colors hover:border-signal lg:hidden"
          >
            <span className="relative block h-3.5 w-5" aria-hidden="true">
              <span
                className={cn(
                  "absolute left-0 block h-[3px] w-5 bg-current transition-all duration-200",
                  menuOpen ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-1.5 block h-[3px] w-5 bg-current transition-opacity duration-150",
                  menuOpen ? "opacity-0" : "opacity-100",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 block h-[3px] w-5 bg-current transition-all duration-200",
                  menuOpen ? "top-1.5 -rotate-45" : "top-3",
                )}
              />
            </span>
          </button>
        </div>
      </nav>

      <div id="mobile-nav" hidden={!menuOpen} className="border-t-2 border-signal bg-navy-900 lg:hidden">
        <div className="u-container py-8">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href} className="border-b-2 border-white/10">
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-5 font-display text-lg font-extrabold uppercase tracking-tight text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-4">
            <Link
              href={signedIn ? (isOfficer ? "/admin" : "/portal") : "/signin"}
              onClick={() => setMenuOpen(false)}
              className="border-2 border-white px-6 py-4 text-center font-display text-xs font-bold uppercase tracking-[0.16em] text-white"
            >
              {signedIn ? (isOfficer ? "Officer dashboard" : "Team portal") : "Sign in with Ion"}
            </Link>
            <Link
              href="/join"
              onClick={() => setMenuOpen(false)}
              className="border-2 border-ink bg-signal px-6 py-4 text-center font-display text-xs font-bold uppercase tracking-[0.16em] text-ink"
            >
              Join the team
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
