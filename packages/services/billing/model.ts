import {
  PLAN_DEFINITIONS,
  subscriptionPlanSchema,
  type PlanLimits,
  type SubscriptionPlan,
} from "@repo/types";
import { z } from "zod";

export const planUsageSchema = z.object({
  plan: subscriptionPlanSchema,
  limits: z.object({
    maxForms: z.number().int().nonnegative(),
    maxTeamUsers: z.number().int().nonnegative(),
    maxResponsesPerMonth: z.number().int().nonnegative(),
  }),
  usage: z.object({
    activeForms: z.number().int().nonnegative(),
    teamUsers: z.number().int().nonnegative(),
    responsesThisMonth: z.number().int().nonnegative(),
  }),
  canCreateForm: z.boolean(),
  canAcceptResponse: z.boolean(),
});

export type PlanUsageOutput = z.infer<typeof planUsageSchema>;

export type PlanLimitReason = "form_limit" | "response_limit" | "team_limit";

export class PlanLimitError extends Error {
  readonly reason: PlanLimitReason;
  readonly plan: SubscriptionPlan;
  readonly limits: PlanLimits;

  constructor(
    reason: PlanLimitReason,
    plan: SubscriptionPlan,
    message: string,
  ) {
    super(message);
    this.name = "PlanLimitError";
    this.reason = reason;
    this.plan = plan;
    this.limits = PLAN_DEFINITIONS[plan].limits;
  }
}
