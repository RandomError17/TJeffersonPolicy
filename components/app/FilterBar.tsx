"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export interface FilterSelect {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

/**
 * URL-driven filters.
 *
 * State lives in the query string rather than component state, so a filtered
 * view is linkable, survives a refresh, and works with the server components
 * that read searchParams.
 */
export function FilterBar({
  searchPlaceholder,
  selects = [],
  actions,
}: {
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");

  // Debounce typing so each keystroke does not push a history entry.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (search === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, params, pathname, router]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const hasFilters = [...params.keys()].some((key) => key === "q" || selects.some((select) => select.name === key));

  return (
    <div className="mb-10 flex flex-wrap items-center gap-4 border-2 border-rule bg-paper-raised p-5">
      {searchPlaceholder ? (
        <div className="min-w-[240px] flex-1">
          <label htmlFor="filter-search" className="sr-only">
            Search
          </label>
          <input
            id="filter-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-h-[52px] w-full border-2 border-rule bg-paper px-5 text-base text-ink placeholder:text-ink/40 focus:border-navy-600 focus:outline-none"
          />
        </div>
      ) : null}

      {selects.map((select) => (
        <label key={select.name} className="flex items-center">
          <span className="sr-only">{select.label}</span>
          <select
            value={params.get(select.name) ?? ""}
            onChange={(event) => setParam(select.name, event.target.value)}
            className="min-h-[52px] border-2 border-rule bg-paper px-4 font-display text-xs font-bold uppercase tracking-[0.08em] text-ink focus:border-navy-600 focus:outline-none"
          >
            <option value="">{select.label}</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          className="min-h-[52px] border-2 border-transparent px-4 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink/60 transition-colors hover:border-ink hover:bg-signal hover:text-ink"
        >
          Clear
        </button>
      ) : null}

      {actions ? <div className="ml-auto flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
