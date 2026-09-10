"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/client/api";
import { cn } from "@/lib/utils/cn";

/**
 * Checkbox that saves on change.
 *
 * The boolean-field counterpart to InlineStatus: used for "paid" checkboxes on
 * a member's profile, where the officer is toggling one flag rather than
 * choosing among options. Optimistic on the box itself, authoritative on
 * refresh; on failure it reverts and shows why.
 */
export function InlineCheckbox({
  endpoint,
  method = "PATCH",
  field,
  checked,
  label,
  extraBody,
  className,
}: {
  endpoint: string;
  method?: "PATCH" | "PUT" | "POST";
  field: string;
  checked: boolean;
  label: string;
  extraBody?: Record<string, unknown>;
  className?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(checked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(next: boolean) {
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
    <div className={cn("inline-flex flex-col", className)}>
      <label className="inline-flex cursor-pointer items-center gap-3 text-base font-medium text-ink">
        <input
          type="checkbox"
          checked={current}
          disabled={busy}
          onChange={(event) => toggle(event.target.checked)}
          className="c-checkbox h-6 w-6 shrink-0 cursor-pointer"
        />
        {label}
      </label>
      {error ? <p className="mt-2 text-xs font-semibold text-bad">{error}</p> : null}
    </div>
  );
}
