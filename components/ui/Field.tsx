"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Form primitives.
 *
 * Controls are deliberately large — 56px tall, 2px borders, square corners —
 * because cramped inputs bunched together were the main thing wrong with the
 * previous pass. Labels sit above in display caps, and every field owns a
 * generous block of vertical space.
 *
 * Accessibility: every control is label-associated, and an invalid one points
 * at its message through aria-describedby with aria-invalid set, so a screen
 * reader announces the problem rather than the border just turning red.
 */

const controlClasses =
  "w-full border-2 border-rule bg-paper-raised px-4 py-4 text-base text-ink min-h-[56px] " +
  "placeholder:text-ink/40 transition-colors focus:border-navy-600 focus:bg-white " +
  "disabled:bg-paper-sunk disabled:text-ink/50 disabled:cursor-not-allowed";

const invalidClasses = "border-bad bg-bad-pale/40 focus:border-bad";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2.5", className)}>
      <label
        htmlFor={id}
        className="block font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink"
      >
        {label}
        {required ? (
          <span className="ml-1.5 text-bad" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className="text-sm leading-relaxed text-ink/60">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="border-l-4 border-bad pl-3 text-sm font-semibold text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(controlClasses, invalid && invalidClasses, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(controlClasses, "min-h-32 resize-y leading-relaxed", invalid && invalidClasses, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({
  invalid,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(controlClasses, "cursor-pointer pr-10 font-medium", invalid && invalidClasses, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

/**
 * Checkbox with a real hit area — the whole row is the target, and the box
 * itself is square with a heavy border to match the rest of the system.
 */
export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3.5 border-2 border-transparent py-1 text-base text-ink",
        "hover:border-rule-faint",
        className,
      )}
    >
      <input type="checkbox" className="c-checkbox mt-0.5 h-5 w-5 shrink-0 cursor-pointer" {...props} />
      <span className="leading-snug">{label}</span>
    </label>
  );
}
