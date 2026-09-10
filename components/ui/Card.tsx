import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Cards are framed blocks: a 2px navy outline on raised paper, square
 * corners, no shadow at rest. The header is separated by a structural
 * rather than a hairline, so the frame reads as constructed rather than
 * floated.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-2 border-rule bg-paper-raised", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b-2 border-rule px-7 py-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("t-h3", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-7 py-6", className)} {...props} />;
}

/**
 * A card that is entirely a link. One anchor, so keyboard order stays sane;
 * the hover offset and the signal bar underneath come from .c-frame-link.
 */
export function LinkCard({
  href,
  className,
  children,
  external,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const classes = cn("c-frame-link group p-8", className);

  if (external ?? /^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
