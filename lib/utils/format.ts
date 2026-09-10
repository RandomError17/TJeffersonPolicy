/**
 * Display formatting. Everything is rendered in the school's timezone so a
 * tournament on a Saturday morning does not appear on Friday for a user whose
 * device clock is set elsewhere.
 */
const TIME_ZONE = "America/New_York";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function formatDay(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dayFormatter.format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

/** "Sep 12 – 14, 2026" style range, collapsing a single-day event. */
export function formatDateRange(start: Date, end?: Date | null): string {
  if (!end || start.toDateString() === end.toDateString()) return formatDate(start);
  return `${dayFormatter.format(start)} – ${dateFormatter.format(end)}`;
}

export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** "in 3 days" / "2 days ago", for deadlines. */
export function formatRelative(value: Date | string | null | undefined, now = new Date()): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, "day");
  const diffHours = Math.round(diffMs / 3_600_000);
  if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, "hour");
  return rtf.format(Math.round(diffMs / 60_000), "minute");
}

/** Two-letter monogram used in place of photographs. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
