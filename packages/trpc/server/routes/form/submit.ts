import { buildZodSchema } from "@repo/validators";
import type { FormField } from "@repo/types";

/**
 * Validates respondent answers against a schema built from DB field rows.
 * Used by public.submit (Phase 5) — schema is always built fresh per submission.
 */
export function validateFormAnswers(
  fields: FormField[],
  answers: Record<string, unknown>,
):
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: import("zod").ZodError } {
  const schema = buildZodSchema(fields, answers);
  const result = schema.safeParse(answers);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data };
}
