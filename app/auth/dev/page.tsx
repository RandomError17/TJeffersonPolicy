import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/States";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ROLES, labelFor } from "@/lib/constants";

export const metadata = { title: "Development sign-in", robots: { index: false, follow: false } };

/**
 * Never prerendered. Whether this route exists at all depends on
 * AUTH_PROVIDER, which is read at request time — a build-time snapshot could
 * otherwise ship a usable picker into a deployment that has since switched to
 * Ion.
 */
export const dynamic = "force-dynamic";

/**
 * Local development account picker.
 *
 * This is intentionally NOT a facsimile of the Ion login screen: no Ion
 * branding, no password field, and a banner saying exactly what it is. It
 * 404s unless AUTH_PROVIDER=dev, which lib/env.ts already refuses to accept in
 * production.
 *
 * Choosing an account submits to the same /api/auth/callback the real provider
 * uses, so the development path exercises the production code path.
 */
export default async function DevSignInPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (env.AUTH_PROVIDER !== "dev" || env.NODE_ENV === "production") notFound();

  const { state } = await searchParams;
  if (!state) notFound();

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
    select: { ionUsername: true, displayName: true, role: true, gradeNumber: true },
    take: 40,
  });

  return (
    <main id="main" className="relative min-h-screen overflow-hidden bg-paper py-20">
      <div className="c-grid-texture-dark absolute inset-0" aria-hidden="true" />
      <div className="u-container relative">
        <div className="mx-auto w-full max-w-xl border-2 border-ink bg-paper-raised p-9 shadow-[10px_10px_0_0_var(--color-navy-600)] sm:p-11">
          <Alert tone="warn" title="Development sign-in">
            This is a local account picker for development. It is not Ion, and no password is involved. Real deployments
            set <code>AUTH_PROVIDER=ion</code>.
          </Alert>

          <h1 className="t-h3 mt-10 text-ink">Choose an account</h1>
          <p className="t-body t-muted mt-4">
            Signs you in as that member so the portal and dashboard can be tested.
          </p>

          {users.length === 0 ? (
            <p className="c-hatch mt-10 border-2 border-rule bg-paper px-6 py-10 text-center text-sm text-ink">
              No accounts yet. Run <code className="font-semibold">npm run db:seed:dev</code> to create some.
            </p>
          ) : (
            <form method="GET" action="/api/auth/callback" className="mt-10 space-y-3">
              <input type="hidden" name="state" value={state} />
              {users.map((user) => (
                <button
                  key={user.ionUsername}
                  type="submit"
                  name="code"
                  value={user.ionUsername}
                  className="flex w-full items-center gap-4 border-2 border-rule-faint px-5 py-4 text-left transition-colors hover:border-ink hover:bg-signal-pale"
                >
                  <Avatar name={user.displayName} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold uppercase tracking-[0.06em] text-ink">
                      {user.displayName}
                    </span>
                    <span className="mt-1 block truncate text-sm text-ink/60">
                      {user.ionUsername}
                      {user.gradeNumber ? ` · grade ${user.gradeNumber}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 border-2 border-rule px-3 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink">
                    {labelFor(ROLES, user.role, "Member")}
                  </span>
                </button>
              ))}
            </form>
          )}

          <p className="mt-10 border-t-2 border-rule pt-7 text-center">
            <Link
              href="/signin"
              className="border-b-2 border-signal pb-1 font-display text-xs font-bold uppercase tracking-[0.16em] text-navy-600 hover:bg-signal hover:text-ink"
            >
              ← Back to sign-in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
