"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Top-level error boundary.
 *
 * The message is deliberately generic: an unexpected server error can carry
 * internal detail, and this page is public. `digest` is shown so a report can
 * be matched to a server log line.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <main id="main" className="relative flex min-h-screen items-center overflow-hidden bg-paper py-24">
      <div className="c-grid-texture-dark absolute inset-0" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 right-0 select-none font-display text-[20rem] font-extrabold leading-none tracking-tighter text-navy-600/[0.06]"
      >
        500
      </span>

      <div className="u-container relative">
        <div className="max-w-2xl">
          <p className="c-label">Something went wrong</p>
          <h1 className="t-h1 mt-8 text-ink">We could not load this page</h1>
          <p className="t-body-lg t-muted mt-10 max-w-xl">
            This is a problem on our side, not something you did. Try again — if it keeps happening, let an officer
            know.
          </p>
          {error.digest ? (
            <p className="mt-8 border-l-4 border-signal py-2 pl-5 font-mono text-sm text-ink/70">
              Reference: <span className="font-semibold text-ink">{error.digest}</span>
            </p>
          ) : null}
          <div className="mt-12 flex flex-wrap gap-4">
            <Button onClick={reset} size="lg">
              Try again
            </Button>
            <ButtonLink href="/" variant="outline" size="lg">
              Back to the home page
            </ButtonLink>
          </div>
        </div>
      </div>
    </main>
  );
}
