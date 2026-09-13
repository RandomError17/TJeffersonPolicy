import { BottomBars } from "@/components/site/BottomBars";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSession } from "@/lib/auth/session";

/**
 * Public shell. Every page in this group opens with a dark hero, so the header
 * is always transparent-until-scroll here.
 *
 * The bottom padding reserves room for the fixed join bar on small screens, so
 * it sits below the last row of footer links rather than on top of them. It is
 * dropped at `lg`, where that bar does not render.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader transparentUntilScroll signedIn={Boolean(session)} isOfficer={session?.user.role === "OFFICER"} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {/* Matches the join bar's full height — its 60px min-height plus the 4px
          top border — so the last row of footer links is never covered. */}
      <div className="h-16 lg:hidden print:hidden" aria-hidden="true" />
      <BottomBars />
    </div>
  );
}
