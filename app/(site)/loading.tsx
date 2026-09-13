/**
 * Streaming fallback for the public pages.
 *
 * Every page in this group is database-backed and server-rendered on demand,
 * so there is a real gap before the first byte of content. This stands in for
 * the dark hero every public page opens with, which keeps the header's
 * white-on-navy type legible during the wait — a paper-coloured skeleton would
 * flash white text on a white field.
 *
 * Sized to the hero rather than the whole page: guessing at the layout below
 * the fold produces a skeleton that visibly disagrees with what arrives.
 */
export default function PublicLoading() {
  return (
    <div className="on-dark relative min-h-[70svh] overflow-hidden bg-navy-900" aria-busy="true">
      <div className="c-grid-texture absolute inset-0" aria-hidden="true" />
      <div className="c-diagonal -right-24 top-[-30%] h-[180%] w-6 opacity-90" aria-hidden="true" />

      <div className="u-container relative pb-24 pt-[calc(var(--header-height)+80px)] md:pb-32 md:pt-[calc(var(--header-height)+120px)]">
        <div className="h-3 w-40 animate-pulse bg-signal/40" />
        <div className="mt-10 h-14 w-full max-w-3xl animate-pulse bg-white/15 md:h-20" />
        <div className="mt-5 h-14 w-2/3 max-w-2xl animate-pulse bg-white/10 md:h-20" />
        <div className="mt-12 h-5 w-full max-w-xl animate-pulse bg-white/10" />
        <div className="mt-3 h-5 w-4/5 max-w-lg animate-pulse bg-white/10" />
      </div>

      <div className="c-rule-signal absolute inset-x-0 bottom-0" aria-hidden="true" />
      <span className="sr-only" role="status">
        Loading
      </span>
    </div>
  );
}
