import { z } from "zod";

import { formFieldOutputSchema } from "../field/model";

export const getPublicFormInputSchema = z
  .object({
    slug: z.string().min(1).max(120).optional(),
    id: z.uuid().optional(),
  })
  .refine((data) => data.slug !== undefined || data.id !== undefined, {
    message: "Either slug or id must be provided",
  });

export const publicFormSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  theme: z.record(z.string(), z.unknown()).nullable(),
  submitButtonText: z.string().nullable(),
  successMessage: z.string().nullable(),
  collectRespondentEmail: z.boolean(),
  fields: z.array(formFieldOutputSchema),
  /** Set when this terminal (IP hash) already submitted — enforced server-side. */
  existingTerminalSubmissionId: z.uuid().nullable(),
});

export const publicExploreFormSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  theme: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.date(),
});

export const submitFormInputSchema = z.object({
  formId: z.uuid(),
  submissionId: z.uuid(),
  answers: z.record(z.string(), z.unknown()),
  completionTimeMs: z.number().int().nonnegative().optional(),
  // Opt-in for confirmation email; only applies when the submitter is signed in and
  // the form has collectRespondentEmail enabled. Defaults to true when omitted.
  sendConfirmationEmail: z.boolean().optional(),
});

export const submitFormOutputSchema = z.object({
  success: z.literal(true),
  deduplicated: z.boolean().optional(),
});

export const recordFunnelProgressInputSchema = z.object({
  formId: z.uuid(),
  stepIndex: z.number().int().min(0).max(200),
  submitted: z.boolean().optional(),
});

export const recordFunnelProgressOutputSchema = z.object({
  ok: z.literal(true),
});

export const getSubmissionInputSchema = z.object({
  slug: z.string().min(1).max(120),
  submissionId: z.uuid(),
});

export const publicSubmissionSchema = z.object({
  submissionId: z.uuid(),
  formId: z.uuid(),
  formTitle: z.string(),
  formSlug: z.string(),
  answers: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
  completionTimeMs: z.number().int().nullable(),
  fields: z.array(formFieldOutputSchema),
});

export type GetPublicFormInput = z.infer<typeof getPublicFormInputSchema>;
export type PublicForm = z.infer<typeof publicFormSchema>;
export type PublicExploreForm = z.infer<typeof publicExploreFormSchema>;
export type SubmitFormInput = z.infer<typeof submitFormInputSchema>;
export type SubmitFormOutput = z.infer<typeof submitFormOutputSchema>;
export type GetSubmissionInput = z.infer<typeof getSubmissionInputSchema>;
export type PublicSubmission = z.infer<typeof publicSubmissionSchema>;
export type RecordFunnelProgressInput = z.infer<typeof recordFunnelProgressInputSchema>;
