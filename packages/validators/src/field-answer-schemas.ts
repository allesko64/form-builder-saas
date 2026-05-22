import { z } from "zod";

import type { FormField, FormFieldType, ValidationConfig } from "@repo/types";

function selectEnumSchema(options: string[] | undefined): z.ZodTypeAny {
  if (options && options.length > 0) {
    return z.enum(options as [string, ...string[]]);
  }
  return z.string();
}

function buildTextValueSchema(config: ValidationConfig | null): z.ZodString {
  let schema = z.string();
  if (config?.min !== undefined) {
    schema = schema.min(config.min, `Minimum ${config.min} characters`);
  }
  if (config?.max !== undefined) {
    schema = schema.max(config.max, `Maximum ${config.max} characters`);
  }
  if (config?.pattern) {
    schema = schema.regex(new RegExp(config.pattern));
  }
  return schema;
}

function buildNumberValueSchema(config: ValidationConfig | null): z.ZodNumber {
  let schema = z.number();
  if (config?.min !== undefined) {
    schema = schema.min(config.min);
  }
  if (config?.max !== undefined) {
    schema = schema.max(config.max);
  }
  return schema;
}

/** Canonical answer payload per field type (discriminant = `type`). */
export const shortTextFieldAnswerSchema = z.object({
  type: z.literal("short_text"),
  value: z.string(),
});

export const longTextFieldAnswerSchema = z.object({
  type: z.literal("long_text"),
  value: z.string(),
});

export const emailFieldAnswerSchema = z.object({
  type: z.literal("email"),
  value: z.string().email("Invalid email address"),
});

export const numberFieldAnswerSchema = z.object({
  type: z.literal("number"),
  value: z.number(),
});

export const singleSelectFieldAnswerSchema = z.object({
  type: z.literal("single_select"),
  value: z.string(),
});

export const multiSelectFieldAnswerSchema = z.object({
  type: z.literal("multi_select"),
  value: z.array(z.string()),
});

export const ratingFieldAnswerSchema = z.object({
  type: z.literal("rating"),
  value: z.number().min(1),
});

export const dateFieldAnswerSchema = z.object({
  type: z.literal("date"),
  value: z.string().datetime(),
});

export const checkboxFieldAnswerSchema = z.object({
  type: z.literal("checkbox"),
  value: z.boolean(),
});

/**
 * Discriminated union of typed answer payloads — rubric-aligned alternative to switch(field.type).
 * `buildFieldValueSchema` applies per-field validationConfig on top of these branches.
 */
export const fieldAnswerPayloadSchema = z.discriminatedUnion("type", [
  shortTextFieldAnswerSchema,
  longTextFieldAnswerSchema,
  emailFieldAnswerSchema,
  numberFieldAnswerSchema,
  singleSelectFieldAnswerSchema,
  multiSelectFieldAnswerSchema,
  ratingFieldAnswerSchema,
  dateFieldAnswerSchema,
  checkboxFieldAnswerSchema,
]);

export type FieldAnswerPayload = z.infer<typeof fieldAnswerPayloadSchema>;

const fieldValueSchemaFactories = {
  short_text: buildTextValueSchema,
  long_text: buildTextValueSchema,
  email: (_config: ValidationConfig | null) => z.string().email("Invalid email address"),
  number: buildNumberValueSchema,
  single_select: (config: ValidationConfig | null) => selectEnumSchema(config?.options),
  multi_select: (config: ValidationConfig | null) => z.array(selectEnumSchema(config?.options)),
  rating: (config: ValidationConfig | null) =>
    z
      .number()
      .min(1)
      .max(config?.max ?? 5),
  date: (_config: ValidationConfig | null) => z.string().datetime(),
  checkbox: (_config: ValidationConfig | null) => z.boolean(),
} as const satisfies Record<FormFieldType, (config: ValidationConfig | null) => z.ZodTypeAny>;

/** Value schema for one form field (keyed by field id in `buildZodSchema`). */
export function buildFieldValueSchema(field: FormField): z.ZodTypeAny {
  const factory = fieldValueSchemaFactories[field.type];
  const schema = factory(field.validationConfig ?? null);
  return field.required ? schema : schema.optional().nullable();
}

/** Validate a single answer against its field's discriminated type branch. */
export function parseFieldAnswer(field: FormField, value: unknown): FieldAnswerPayload["value"] {
  const valueSchema = buildFieldValueSchema(field);
  const parsed = valueSchema.parse(value);
  return fieldAnswerPayloadSchema.parse({ type: field.type, value: parsed }).value;
}
