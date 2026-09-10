"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/client/api";
import { cn } from "@/lib/utils/cn";

/**
 * Select that saves on change.
 *
 * Used across the officer tables where the common action is "set this row's
 * status". Optimistic on the select itself, authoritative on refresh; on
 * failure it reverts and shows why.
 */
export function InlineStatus({
  endpoint,
  method = "PATCH",
  field = "status",
  value,
  options,
  label,
  extraBody,
  className,
}: {
  endpoint: string;
  method?: "PATCH" | "PUT" | "POST";
  field?: string;
  value: string;
  options: Record<string, string>;
  label: string;
  extraBody?: Record<string, unknown>;
  className?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    const previous = current;
    setCurrent(next);
    setBusy(true);
    setError(null);

    try {
      const body = { ...extraBody, [field]: next };
      if (method === "PUT") await api.put(endpoint, body);
      else if (method === "POST") await api.post(endpoint, body);
      else await api.patch(endpoint, body);
      router.refresh();
    } catch (caught) {
      setCurrent(previous);
      setError(caught instanceof ApiError ? caught.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("min-w-0", className)}>
      <label className="sr-only" htmlFor={`${endpoint}-${field}`}>
        {label}
      </label>
      <select
        id={`${endpoint}-${field}`}
        value={current}
        disabled={busy}
        onChange={(event) => change(event.target.value)}
        className="min-h-[44px] w-full border-2 border-rule bg-paper-raised px-3 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-ink focus:border-navy-600 focus:outline-none disabled:opacity-50"
      >
        {Object.entries(options).map(([key, optionLabel]) => (
          <option key={key} value={key}>
            {optionLabel}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-xs font-semibold text-bad">{error}</p> : null}
    </div>
  );
}
