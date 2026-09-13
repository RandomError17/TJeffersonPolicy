import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/States";
import { getSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { CLUB, EXTERNAL_LINKS } from "@/lib/content/club";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the TJ Policy Debate team portal with your TJ Ion account.",
  robots: { index: false, follow: false },
};

/** Provider failures are reported as short codes; this maps them to plain English. */
const ERROR_MESSAGES: Record<string, string> = {
  denied: "Sign-in was cancelled. You can try again whenever you are ready.",
  expired: "That sign-in link expired. Start again from this page.",
  invalid_request: "The sign-in response was incomplete. Please try again.",
  invalid_state: "The sign-in response could not be verified. Please try again.",
  rate_limited: "Too many sign-in attempts. Wait a few minutes and try again.",
  not_a_student: "That account is not a TJ student or staff account, so it cannot be used here.",
  exchange_failed: "Ion could not complete the sign-in. Please try again in a moment.",
  profile_failed: "We signed you in but could not read your Ion profile. Please try again.",
  provider_error: "Something went wrong talking to Ion. Please try again in a moment.",
  disabled: "Sign-in is not configured on this deployment yet.",
};

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const session = await getSession();
  const { error, next } = await searchParams;

  if (session) redirect(session.user.role === "OFFICER" ? "/admin" : "/portal");

  const usingIon = env.AUTH_PROVIDER === "ion";
  const loginHref = `/api/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <main id="main" className="on-dark relative min-h-screen overflow-hidden bg-navy-900">
      <div className="c-grid-texture absolute inset-0" aria-hidden="true" />
      <div className="c-diagonal -left-40 top-[-30%] h-[180%] w-12 opacity-80" aria-hidden="true" />
      <div className="c-diagonal -left-16 top-[-30%] h-[180%] w-3 opacity-50" aria-hidden="true" />

      <div className="u-container relative flex min-h-screen items-center py-20">
        <div className="u-grid-12 w-full items-center">
          {/* Identity rail — the constructivist half of the split. */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-7">
            <Link href="/" className="inline-flex items-center gap-4">
              <Image src="/brand/logo.svg" alt="" width={52} height={52} className="h-[52px] w-[52px]" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
                {CLUB.shortName}
              </span>
            </Link>
            <p className="c-label mt-14">Members only</p>
            <h1 className="t-h1 mt-8 max-w-xl text-white">Team portal</h1>
            <p className="t-body-lg mt-10 max-w-md text-white/70">
              For current members of TJ Policy Debate. Sign in to register for tournaments and check dues, orders, and
              resources.
            </p>
          </div>

          {/* The action panel. */}
          <div className="col-span-12 mt-14 lg:col-span-6 lg:mt-0 xl:col-span-5">
            <div className="border-2 border-ink bg-paper-raised p-9 shadow-[10px_10px_0_0_var(--color-signal)] sm:p-11">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-navy-600">Sign in</p>

              {error ? (
                <div className="mt-8">
                  <Alert tone="bad" title="Could not sign you in">
                    {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
                  </Alert>
                </div>
              ) : null}

              <a
                href={loginHref}
                className="mt-8 flex min-h-[60px] w-full items-center justify-center gap-3 border-2 border-ink bg-navy-800 px-6 font-display text-sm font-bold uppercase tracking-[0.1em] text-white transition-[transform,box-shadow] duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_0_var(--color-signal)] motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
              >
                {usingIon ? (
                  <>
                    <Image src="/brand/ionLogo.png" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
                    Continue with TJ Ion
                  </>
                ) : (
                  "Continue with a development account"
                )}
              </a>

              {usingIon ? (
                <p className="t-body t-muted mt-7 text-sm">
                  You will sign in on <span className="font-semibold text-ink">ion.tjhsst.edu</span>. This site never
                  sees your Ion password.
                </p>
              ) : (
                <div className="mt-7">
                  <Alert tone="warn" title="Development mode">
                    This deployment is using local development accounts, not Ion. Set <code>AUTH_PROVIDER=ion</code>{" "}
                    with Ion OAuth credentials to enable real sign-in.
                  </Alert>
                </div>
              )}

              <div className="mt-10 border-t-2 border-rule pt-7 text-sm text-ink/70">
                Not on the team yet?{" "}
                <Link href="/join" className="border-b-2 border-signal font-semibold text-ink hover:bg-signal hover:text-paper">
                  See how to join
                </Link>
              </div>
            </div>

            <p className="mt-8 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              <Link href="/" className="hover:text-signal-bright">
                ← Back to the public site
              </Link>
              <span className="mx-3" aria-hidden="true">
                ·
              </span>
              <a href={EXTERNAL_LINKS.ion} target="_blank" rel="noopener noreferrer" className="hover:text-signal-bright">
                TJ Ion
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
