/**
 * SQLite has no array type, so list-valued columns are stored as JSON text.
 * These helpers keep the parsing defensive: a malformed value degrades to an
 * empty list rather than throwing inside a render.
 */
export function parseStringList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function serializeStringList(values: readonly string[]): string {
  return JSON.stringify([...values]);
}

export function parseRecord(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
