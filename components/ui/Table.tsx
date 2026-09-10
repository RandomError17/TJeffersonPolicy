import { cn } from "@/lib/utils/cn";

/**
 * Tables read as printed ledgers: a solid navy header band, heavy outer
 * frame, and structural rules between rows.
 *
 * The wrapper scrolls horizontally on its own so a wide roster never makes the
 * page body scroll sideways on a phone. `tabIndex` makes that scroll region
 * reachable by keyboard, which is required when a scroll container holds
 * content.
 */
export function TableWrap({ className, children, label }: { className?: string; children: React.ReactNode; label: string }) {
  return (
    <div
      className={cn("table-scroll border-2 border-rule bg-paper-raised", className)}
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-[640px] border-collapse text-base", className)} {...props} />;
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "bg-navy-800 px-5 py-4 text-left font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b-2 border-rule-faint px-5 py-4 align-middle text-ink", className)} {...props} />;
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-paper-sunk", className)} {...props} />;
}
