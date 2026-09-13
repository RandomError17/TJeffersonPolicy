import { BottomBars } from "@/components/site/BottomBars";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSession } from "@/lib/auth/session";

/**
 * Public shell. Every page in this group opens with a dark hero, so the header
 * is always transparent-until-scroll here.
 *
 * `BottomBars` renders whichever fixed bar applies (cookie notice or join bar)
 * plus the in-flow spacer that reserves room for it below the footer, sized to
 * that bar's real measured height rather than a constant.
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
      <BottomBars />
    </div>
  );
}
