/** URL-safe slug. Falls back to a random suffix when the input has no letters. */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return base || `item-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Append -2, -3, … until the slug is free. `exists` is injected so this stays
 * a pure function that can be unit tested without a database.
 */
export async function uniqueSlug(input: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const base = slugify(input);
  let candidate = base;
  for (let n = 2; n < 100; n += 1) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}
