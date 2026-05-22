import { z } from "zod";

export const visibilityOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "is_empty",
  "is_not_empty",
]);

export type VisibilityOperator = z.infer<typeof visibilityOperatorSchema>;

export const visibilityRuleSchema = z.object({
  fieldId: z.string().uuid(),
  operator: visibilityOperatorSchema,
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .optional(),
});

export type VisibilityRule = z.infer<typeof visibilityRuleSchema>;

export const visibilityConfigSchema = z.object({
  mode: z.enum(["show_when", "hide_when"]).default("show_when"),
  rules: z.array(visibilityRuleSchema).min(1),
});

export type VisibilityConfig = z.infer<typeof visibilityConfigSchema>;
