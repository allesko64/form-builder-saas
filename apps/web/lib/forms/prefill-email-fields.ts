export type EmailFieldLike = { id: string; type: string };

function isEmptyAnswer(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/** Fills empty `email` fields with the signed-in account email. Returns null if unchanged. */
export function prefillEmptyEmailFields<T extends EmailFieldLike>(
  fields: T[],
  answers: Record<string, unknown>,
  accountEmail: string,
): Record<string, unknown> | null {
  let changed = false;
  const next = { ...answers };

  for (const field of fields) {
    if (field.type !== "email") continue;
    if (!isEmptyAnswer(next[field.id])) continue;
    next[field.id] = accountEmail;
    changed = true;
  }

  return changed ? next : null;
}
