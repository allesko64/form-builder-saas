const MAX_SLUG_LENGTH = 100;

/** URL-safe slug from a form title (readable public URLs). */
export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);

  return slug.length > 0 ? slug : "form";
}

/** Append -2, -3, … until the candidate fits max length (DB column is 120). */
export function slugWithSuffix(base: string, suffix: number): string {
  const suffixPart = suffix === 1 ? "" : `-${suffix}`;
  const maxBase = 120 - suffixPart.length;
  const trimmedBase = base.slice(0, maxBase).replace(/-+$/g, "") || "form";
  return `${trimmedBase}${suffixPart}`;
}
