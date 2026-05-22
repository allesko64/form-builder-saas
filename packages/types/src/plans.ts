import { z } from "zod";

/** Subscription tier — matches DB `subscription_plan` enum. */
export const subscriptionPlanSchema = z.enum([
  "free",
  "senior_handler",
  "agency_bureau",
]);

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export type PlanLimits = {
  maxForms: number;
  maxTeamUsers: number;
  maxResponsesPerMonth: number;
};

export type PlanPricingInr = {
  monthly: number;
  yearlyPerMonth: number;
  yearlyTotal: number;
};

export type PlanDefinition = {
  id: SubscriptionPlan;
  name: string;
  stamp: string;
  pricing: PlanPricingInr;
  limits: PlanLimits;
  features: readonly string[];
};

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Field Operative",
    stamp: "DRAFT CLEARANCE",
    pricing: { monthly: 0, yearlyPerMonth: 0, yearlyTotal: 0 },
    limits: {
      maxForms: 5,
      maxTeamUsers: 1,
      maxResponsesPerMonth: 1_000,
    },
    features: [
      "Up to 5 active dossiers",
      "1 operative (solo)",
      "1,000 responses / month",
      "All standard field types",
      "Publish, analytics, CSV export",
      "Conditional logic & live analytics",
    ],
  },
  senior_handler: {
    id: "senior_handler",
    name: "Senior Handler",
    stamp: "PRIORITY",
    pricing: { monthly: 999, yearlyPerMonth: 799, yearlyTotal: 9_588 },
    limits: {
      maxForms: 25,
      maxTeamUsers: 3,
      maxResponsesPerMonth: 10_000,
    },
    features: [
      "Up to 25 active dossiers",
      "3 team operatives",
      "10,000 responses / month",
      "Everything in Field Operative",
      "Custom themes",
      "Image question + AI generation (coming soon)",
      "Priority transmission",
    ],
  },
  agency_bureau: {
    id: "agency_bureau",
    name: "Agency Bureau",
    stamp: "CLASSIFIED",
    pricing: { monthly: 2_499, yearlyPerMonth: 1_999, yearlyTotal: 23_988 },
    limits: {
      maxForms: 100,
      maxTeamUsers: 10,
      maxResponsesPerMonth: 25_000,
    },
    features: [
      "Up to 100 active dossiers",
      "10 team operatives",
      "25,000 responses / month",
      "Everything in Senior Handler",
      "Video question + AI explainer (coming soon)",
      "SSO & audit logs (roadmap)",
      "Custom domains (roadmap)",
    ],
  },
};

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_DEFINITIONS[plan].limits;
}
