import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main
      id="main"
      className="on-dark relative flex min-h-screen items-center overflow-hidden bg-navy-900 py-24"
    >
      <div className="c-grid-texture absolute inset-0" aria-hidden="true" />
      <div className="c-diagonal -right-32 top-[-40%] h-[200%] w-10 opacity-90" aria-hidden="true" />
      <div className="c-diagonal -right-4 top-[-40%] h-[200%] w-3 opacity-60" aria-hidden="true" />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 left-4 select-none font-display text-[24rem] font-extrabold leading-none tracking-tighter text-white/[0.05] lg:left-16"
      >
        404
      </span>

      <div className="u-container relative">
        <div className="max-w-2xl">
          <Image src="/brand/logo.svg" alt="" width={56} height={56} className="h-14 w-14" />
          <p className="c-label mt-12">Error 404</p>
          <h1 className="t-h1 mt-8 text-white">This page does not exist</h1>
          <p className="t-body-lg mt-10 max-w-xl text-white/70">
            The link may be out of date, or the page may have moved. Everything on the site is reachable from the home
            page.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <ButtonLink href="/" variant="primary" size="lg">
              Back to the home page
            </ButtonLink>
            <ButtonLink href="/contact" variant="onDark" size="lg">
              Contact the team
            </ButtonLink>
          </div>
          <p className="mt-16 border-t-2 border-white/15 pt-8 text-sm text-white/50">
            Looking for the team portal?{" "}
            <Link href="/signin" className="border-b-2 border-signal font-semibold text-white hover:bg-signal hover:text-ink">
              Sign in here
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
