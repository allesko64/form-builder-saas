import { z } from "zod";

import { fieldTypeSchema } from "../field/model";

export const analyticsFormIdSchema = z.object({
  formId: z.uuid(),
});

export const analyticsOverviewSchema = z.object({
  totalResponses: z.number(),
  avgCompletionMs: z.number().nullable(),
  /** Share of submitted responses with a recorded completion time. */
  timedResponseRate: z.number(),
  /** @deprecated Use timedResponseRate — kept for older clients. */
  completionRate: z.number(),
  /** Unique sessions that opened the public form. */
  formStarts: z.number(),
  /** Submitted responses / form starts (0–1). */
  submissionRate: z.number(),
  /** Abandonment: (starts − submissions) / starts (0–1). */
  dropoffRate: z.number(),
});

export const analyticsDropoffSchema = z.object({
  formStarts: z.number(),
  submissions: z.number(),
  abandoned: z.number(),
  dropoffRate: z.number(),
  submissionRate: z.number(),
});

export const analyticsFunnelStepSchema = z.object({
  stepIndex: z.number(),
  fieldId: z.uuid().nullable(),
  label: z.string(),
  reached: z.number(),
  /** Retention vs form starts (0–1). */
  retentionRate: z.number(),
  /** Dropoff vs previous step (0–1), null for first step. */
  stepDropoffRate: z.number().nullable(),
});

export const analyticsFunnelSchema = z.object({
  formStarts: z.number(),
  submissions: z.number(),
  steps: z.array(analyticsFunnelStepSchema),
});

export const analyticsByDayItemSchema = z.object({
  day: z.string(),
  count: z.number(),
});

export const analyticsByDaySchema = z.array(analyticsByDayItemSchema);

export const verbatimSampleSchema = z.object({
  text: z.string(),
  submittedAt: z.string(),
});

export const fieldDistributionStatsSchema = z.object({
  optionCounts: z.record(z.string(), z.number()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  average: z.number().optional(),
  /** Newest-first verbatim answers (max 10). */
  recentSamples: z.array(verbatimSampleSchema).optional(),
  /** Total non-empty answers for this field (all time). */
  responseCount: z.number().optional(),
});

export const analyticsByFieldItemSchema = z.object({
  fieldId: z.uuid(),
  label: z.string(),
  type: fieldTypeSchema,
  stats: fieldDistributionStatsSchema,
});

export const analyticsByFieldSchema = z.array(analyticsByFieldItemSchema);

export const listResponsesInputSchema = z.object({
  formId: z.uuid(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  email: z.string().max(255).optional(),
});

export const responseListItemSchema = z.object({
  id: z.uuid(),
  submissionId: z.uuid(),
  respondentEmail: z.string().nullable(),
  answers: z.record(z.string(), z.unknown()),
  completionTimeMs: z.number().nullable(),
  createdAt: z.date(),
});

export const listResponsesOutputSchema = z.object({
  items: z.array(responseListItemSchema),
  nextCursor: z.string().nullable(),
});

export const exportCsvOutputSchema = z.object({
  csv: z.string(),
  filename: z.string(),
});

export type AnalyticsFormId = z.infer<typeof analyticsFormIdSchema>;
export type ListResponsesInput = z.infer<typeof listResponsesInputSchema>;
export type ExportCsvOutput = z.infer<typeof exportCsvOutputSchema>;
