import { cn } from "@/lib/utils/cn";

/**
 * The dark hero band every public page opens with.
 *
 * Structure instead of atmosphere: a flat navy field, a printed grid texture,
 * two hard diagonal bars in signal amber, and a heavy rule pinning the bottom
 * edge. No gradients — the depth here comes from overlapping flat shapes.
 *
 * Making it universal also keeps the header's transparent-to-solid behaviour
 * honest: there is never a page where white type lands on a white ground.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  index,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Optional oversized numeral, printed into the corner of the band. */
  index?: string;
  className?: string;
}) {
  return (
    <section className={cn("on-dark relative overflow-hidden bg-navy-900", className)}>
      <div className="c-grid-texture absolute inset-0" aria-hidden="true" />

      {/* Two crossed diagonals, cropped by the band — the constructivist
          gesture that keeps a flat field from reading as a plain box. */}
      <div className="c-diagonal -right-24 top-[-30%] h-[180%] w-6 opacity-90" aria-hidden="true" />
      <div className="c-diagonal -right-2 top-[-30%] h-[180%] w-2 opacity-60" aria-hidden="true" />

      {index ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 font-display text-[14rem] font-extrabold leading-none text-white/[0.05] lg:block"
        >
          {index}
        </span>
      ) : null}

      <div className="u-container relative pb-24 pt-[calc(var(--header-height)+80px)] md:pb-32 md:pt-[calc(var(--header-height)+120px)]">
        {eyebrow ? <p className="c-label mb-8">{eyebrow}</p> : null}
        <h1 className="t-h1 max-w-4xl text-white">{title}</h1>
        {description ? (
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/70">{description}</p>
        ) : null}
        {children ? <div className="mt-12">{children}</div> : null}
      </div>

      <div className="c-rule-signal absolute inset-x-0 bottom-0" aria-hidden="true" />
    </section>
  );
}

/** Section wrapper carrying the site's vertical rhythm and container width. */
export function Section({
  children,
  className,
  id,
  tone = "paper",
  tight = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "paper" | "raised" | "sunk" | "navy";
  tight?: boolean;
}) {
  const tones = {
    paper: "bg-paper",
    raised: "bg-paper-raised",
    sunk: "bg-paper-sunk",
    navy: "on-dark bg-navy-900 text-white",
  } as const;

  return (
    <section id={id} className={cn(tight ? "u-section-tight" : "u-section", tones[tone], className)}>
      <div className="u-container">{children}</div>
    </section>
  );
}

/**
 * Section heading block: micro label, oversized display heading, and an
 * optional lead paragraph held well below it so the scale jump is obvious.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  /** Accepts nodes so a page can hard-break a headline across its own lines. */
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className={cn("c-label mb-6", align === "center" && "justify-center")}>{eyebrow}</p>
      ) : null}
      <h2 className="t-h2">{title}</h2>
      {description ? (
        <p className={cn("mt-8 text-lg leading-relaxed text-ink/65", align === "center" && "mx-auto")}>{description}</p>
      ) : null}
    </div>
  );
}
