import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Buttons are hard-edged blocks, not pills.
 *
 * `primary` is the only variant that uses signal amber, because amber is the
 * 10% of the palette reserved for calls to action — see the colour note in
 * app/globals.css. Everything else is navy or an outline, so a page can carry
 * many actions while still pointing at one.
 *
 * The hover gesture is a hard offset with a solid drop block, which is how a
 * constructivist layout suggests depth: no blur, no soft shadow.
 */
type Variant = "primary" | "solid" | "outline" | "ghost" | "danger" | "onDark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 border-2 font-display font-bold uppercase tracking-[0.1em] " +
  "transition-[transform,box-shadow,background-color,color] duration-150 [transition-timing-function:var(--ease-out-soft)] " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0 disabled:hover:translate-y-0 " +
  "disabled:hover:shadow-none whitespace-nowrap motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "border-ink bg-signal text-ink hover:-translate-x-[3px] hover:-translate-y-[3px] " +
    "hover:shadow-[5px_5px_0_0_var(--color-ink)]",
  solid:
    "border-navy-800 bg-navy-800 text-white hover:-translate-x-[3px] hover:-translate-y-[3px] " +
    "hover:shadow-[5px_5px_0_0_var(--color-signal)]",
  outline:
    "border-ink bg-transparent text-ink hover:-translate-x-[3px] hover:-translate-y-[3px] " +
    "hover:shadow-[5px_5px_0_0_var(--color-navy-600)]",
  ghost: "border-transparent bg-transparent text-navy-600 hover:border-ink hover:bg-paper-sunk",
  danger:
    "border-bad bg-transparent text-bad hover:bg-bad hover:text-white hover:-translate-x-[3px] " +
    "hover:-translate-y-[3px] hover:shadow-[5px_5px_0_0_var(--color-ink)]",
  onDark:
    "border-white bg-transparent text-white hover:bg-white hover:text-navy-900 " +
    "hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_0_var(--color-signal)]",
};

/* Generous hit areas — no cramped controls. Every size clears 44px tall. */
const sizes: Record<Size, string> = {
  sm: "px-4 py-2.5 text-[11px] min-h-[44px]",
  md: "px-6 py-3.5 text-xs min-h-[52px]",
  lg: "px-9 py-5 text-sm min-h-[60px]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

/** Link styled as a button. External hrefs get the security attributes automatically. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  external,
  ...props
}: CommonProps & { href: string; external?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const isExternal = external ?? /^https?:\/\//.test(href);
  const classes = cn(base, variants[variant], sizes[size], className);

  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props} />;
  }
  return <Link href={href} className={classes} {...props} />;
}
