import {
  formFieldTypeSchema,
  validationConfigSchema as validationConfigObjectSchema,
  visibilityConfigSchema,
} from "@repo/types";
import { z } from "zod";

export const fieldTypeSchema = formFieldTypeSchema;

export const validationConfigSchema = validationConfigObjectSchema.nullable();

export const formFieldOutputSchema = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  label: z.string(),
  placeholder: z.string().nullable(),
  helpText: z.string().nullable(),
  type: fieldTypeSchema,
  required: z.boolean(),
  sortOrder: z.number(),
  validationConfig: validationConfigSchema,
  visibilityConfig: visibilityConfigSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createFieldInputSchema = z.object({
  formId: z.uuid(),
  label: z.string().min(1).max(200),
  type: fieldTypeSchema,
  required: z.boolean().optional(),
  placeholder: z.string().max(200).nullable().optional(),
  helpText: z.string().max(5000).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  validationConfig: validationConfigObjectSchema.nullable().optional(),
  visibilityConfig: visibilityConfigSchema.nullable().optional(),
});

export const updateFieldInputSchema = z
  .object({
    id: z.uuid(),
    label: z.string().min(1).max(200).optional(),
    type: fieldTypeSchema.optional(),
    required: z.boolean().optional(),
    placeholder: z.string().max(200).nullable().optional(),
    helpText: z.string().max(5000).nullable().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
    validationConfig: validationConfigObjectSchema.nullable().optional(),
    visibilityConfig: visibilityConfigSchema.nullable().optional(),
  })
  .refine(
    (data) =>
      data.label !== undefined ||
      data.type !== undefined ||
      data.required !== undefined ||
      data.placeholder !== undefined ||
      data.helpText !== undefined ||
      data.sortOrder !== undefined ||
      data.validationConfig !== undefined ||
      data.visibilityConfig !== undefined,
    { message: "At least one field must be provided to update" },
  );

export const fieldIdInputSchema = z.object({
  id: z.uuid(),
});

export const reorderFieldsInputSchema = z.object({
  formId: z.uuid(),
  order: z
    .array(
      z.object({
        id: z.uuid(),
        sortOrder: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

export const deleteFieldOutputSchema = z.object({
  success: z.literal(true),
  formId: z.uuid(),
});

export type CreateFieldInput = z.infer<typeof createFieldInputSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldInputSchema>;
export type ReorderFieldsInput = z.infer<typeof reorderFieldsInputSchema>;
export type FormFieldOutput = z.infer<typeof formFieldOutputSchema>;
export type DeleteFieldOutput = z.infer<typeof deleteFieldOutputSchema>;
