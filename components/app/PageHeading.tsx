import { cn } from "@/lib/utils/cn";

/**
 * Page header for the portal and dashboard.
 *
 * The heavy rule under the title is the structural device that separates a
 * page's identity from its working area — the dashboard equivalent of the
 * public site's hero band.
 */
export function PageHeading({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-12", className)}>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="t-h2 text-ink">{title}</h1>
          {description ? <p className="t-body t-muted mt-5 max-w-2xl">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className="c-rule mt-8" />
    </div>
  );
}

/** Metric tile. Flat, framed, and oversized where the number is the point. */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
  href?: string;
}) {
  const tones = {
    default: "border-rule bg-paper-raised",
    good: "border-good bg-good-pale",
    warn: "border-warn bg-warn-pale",
    bad: "border-bad bg-bad-pale",
  } as const;

  const inner = (
    <>
      <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink/60">{label}</p>
      <p className="mt-5 font-display text-4xl font-extrabold tabular-nums leading-none tracking-tight text-ink">
        {value}
      </p>
      {hint ? <p className="mt-3 text-sm leading-relaxed text-ink/60">{hint}</p> : null}
    </>
  );

  const classes = cn("block border-2 p-7", tones[tone]);

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          classes,
          "transition-[transform,box-shadow] duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px]",
          "hover:shadow-[5px_5px_0_0_var(--color-navy-600)] motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0",
        )}
      >
        {inner}
      </a>
    );
  }
  return <div className={classes}>{inner}</div>;
}
