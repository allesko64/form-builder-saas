import { z } from "zod";

import type { VisibilityConfig } from "./visibility";
import { visibilityConfigSchema } from "./visibility";

/** Shared with DB `form_field_type` enum and API field schemas. */
export const formFieldTypeSchema = z.enum([
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "rating",
  "date",
  "checkbox",
]);

export type FormFieldType = z.infer<typeof formFieldTypeSchema>;

export const validationConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  options: z.array(z.string()).optional(),
});

export type ValidationConfig = z.infer<typeof validationConfigSchema>;

const formFieldBaseSchema = z.object({
  id: z.string(),
  required: z.boolean(),
  sortOrder: z.number(),
  validationConfig: validationConfigSchema.nullable().optional(),
  visibilityConfig: visibilityConfigSchema.nullable().optional(),
});

export const shortTextFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("short_text"),
});

export const longTextFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("long_text"),
});

export const emailFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("email"),
});

export const numberFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("number"),
});

export const singleSelectFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("single_select"),
});

export const multiSelectFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("multi_select"),
});

export const ratingFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("rating"),
});

export const dateFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("date"),
});

export const checkboxFormFieldSchema = formFieldBaseSchema.extend({
  type: z.literal("checkbox"),
});

/**
 * Discriminated union of form field definitions by `type`.
 * Used by dynamic Zod builders and shared across web + API.
 */
export const formFieldSchema = z.discriminatedUnion("type", [
  shortTextFormFieldSchema,
  longTextFormFieldSchema,
  emailFormFieldSchema,
  numberFormFieldSchema,
  singleSelectFormFieldSchema,
  multiSelectFormFieldSchema,
  ratingFormFieldSchema,
  dateFormFieldSchema,
  checkboxFormFieldSchema,
]);

/** Minimal shape for building response schemas — `z.infer` from discriminated union. */
export type FormField = z.infer<typeof formFieldSchema>;

/** @deprecated Use `FormField` from discriminated union; alias for visibility helpers. */
export type FormFieldWithVisibility = FormField & {
  visibilityConfig?: VisibilityConfig | null;
};
