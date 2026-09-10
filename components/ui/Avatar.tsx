import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

/**
 * Monogram avatar — a square navy block, not a circle, so it sits in the same
 * geometric family as everything else.
 *
 * The site deliberately does not pull photographs from Ion: the profile-picture
 * endpoint requires an authenticated request, and republishing students'
 * yearbook photos is not something a club site should do by default. Officers
 * may set an explicit public photo on their own officer profile.
 */
export function Avatar({
  name,
  photoUrl,
  size = "md",
  className,
}: {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-9 w-9 text-[11px]",
    md: "h-11 w-11 text-xs",
    lg: "h-16 w-16 text-base",
    xl: "h-24 w-24 text-2xl",
  } as const;

  if (photoUrl) {
    return (
      // Officer-supplied external URL; next/image would need per-host config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={cn("shrink-0 border-2 border-rule object-cover grayscale", sizes[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border-2 border-ink bg-navy-800 font-display font-bold uppercase tracking-tight text-white",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
