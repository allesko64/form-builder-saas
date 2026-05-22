import { visibilityConfigSchema } from "@repo/types";
import { z } from "zod";

export const formStatusSchema = z.enum(["draft", "published_public", "published_unlisted"]);

export const createFormInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
});

export const formIdInputSchema = z.object({
  id: z.uuid(),
});

/** @deprecated Use formIdInputSchema */
export const getFormByIdInputSchema = formIdInputSchema;

export const updateFormInputSchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    theme: z.record(z.string(), z.unknown()).nullable().optional(),
    submitButtonText: z.string().min(1).max(80).optional(),
    successMessage: z.string().max(5000).nullable().optional(),
    responseLimit: z.number().int().positive().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    collectRespondentEmail: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.theme !== undefined ||
      data.submitButtonText !== undefined ||
      data.successMessage !== undefined ||
      data.responseLimit !== undefined ||
      data.expiresAt !== undefined ||
      data.collectRespondentEmail !== undefined,
    { message: "At least one field must be provided to update" },
  );

export const publishFormInputSchema = z.object({
  id: z.uuid(),
  status: z.enum(["published_public", "published_unlisted"]),
});

export const deleteFormOutputSchema = z.object({
  success: z.literal(true),
});

export const formFieldOutputSchema = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  label: z.string(),
  placeholder: z.string().nullable(),
  helpText: z.string().nullable(),
  type: z.enum([
    "short_text",
    "long_text",
    "email",
    "number",
    "single_select",
    "multi_select",
    "rating",
    "date",
    "checkbox",
  ]),
  required: z.boolean(),
  sortOrder: z.number(),
  validationConfig: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      options: z.array(z.string()).optional(),
    })
    .nullable(),
  visibilityConfig: visibilityConfigSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const formOutputSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: formStatusSchema,
  theme: z.record(z.string(), z.unknown()).nullable(),
  submitButtonText: z.string(),
  successMessage: z.string().nullable(),
  responseLimit: z.number().int().positive().nullable(),
  expiresAt: z.coerce.date().nullable(),
  collectRespondentEmail: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Dashboard list — form metadata plus submission and field counts. */
export const formListItemOutputSchema = formOutputSchema.extend({
  responseCount: z.number().int().nonnegative(),
  fieldCount: z.number().int().nonnegative(),
});

export const getFormByIdOutputSchema = formOutputSchema.extend({
  fields: z.array(formFieldOutputSchema),
});

export type FormFieldOutput = z.infer<typeof formFieldOutputSchema>;
export type CreateFormInput = z.infer<typeof createFormInputSchema>;
export type UpdateFormInput = z.infer<typeof updateFormInputSchema>;
export type PublishFormInput = z.infer<typeof publishFormInputSchema>;
export type FormIdInput = z.infer<typeof formIdInputSchema>;
export type FormOutput = z.infer<typeof formOutputSchema>;
export type FormListItemOutput = z.infer<typeof formListItemOutputSchema>;
export type GetFormByIdInput = z.infer<typeof getFormByIdInputSchema>;
export type GetFormByIdOutput = z.infer<typeof getFormByIdOutputSchema>;
export type DeleteFormOutput = z.infer<typeof deleteFormOutputSchema>;
