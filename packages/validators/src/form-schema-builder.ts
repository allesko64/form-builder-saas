import { z } from "zod";

import type { FormField } from "@repo/types";

import { buildFieldValueSchema } from "./field-answer-schemas";
import { getVisibleFields } from "./field-visibility";

/**
 * Builds a dynamic Zod object schema for form answers.
 * Per-field value schemas come from the discriminated union pipeline in `field-answer-schemas.ts`.
 */
export function buildZodSchema(
  fields: FormField[],
  answers?: Record<string, unknown>,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  const fieldsToValidate =
    answers !== undefined
      ? getVisibleFields(fields, answers)
      : [...fields].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const field of fieldsToValidate) {
    shape[field.id] = buildFieldValueSchema(field);
  }

  // Reject answer keys that are not on this form / not currently visible (Layer 6).
  return z.object(shape).strict();
}
