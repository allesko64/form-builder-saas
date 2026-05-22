import { and, count, db, eq, gte, inArray, isNull } from "@repo/database";
import { formsTable, responsesTable, user } from "@repo/database/schema";
import {
  getPlanLimits,
  type PlanLimits,
  type SubscriptionPlan,
  subscriptionPlanSchema,
} from "@repo/types";

import { PlanLimitError, type PlanUsageOutput } from "./model";

function startOfUtcMonth(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

class BillingService {
  public async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    const [row] = await db
      .select({ plan: user.plan })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!row) {
      return "free";
    }

    return subscriptionPlanSchema.parse(row.plan);
  }

  public async countActiveForms(userId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(formsTable)
      .where(and(eq(formsTable.userId, userId), isNull(formsTable.deletedAt)));

    return Number(row?.total ?? 0);
  }

  /** Solo accounts = 1; extend when org/team tables exist. */
  public async countTeamUsers(_userId: string): Promise<number> {
    return 1;
  }

  public async countResponsesThisMonth(userId: string): Promise<number> {
    const formRows = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(and(eq(formsTable.userId, userId), isNull(formsTable.deletedAt)));

    if (formRows.length === 0) {
      return 0;
    }

    const formIds = formRows.map((f) => f.id);
    const monthStart = startOfUtcMonth();

    const [row] = await db
      .select({ total: count() })
      .from(responsesTable)
      .where(
        and(inArray(responsesTable.formId, formIds), gte(responsesTable.createdAt, monthStart)),
      );

    return Number(row?.total ?? 0);
  }

  public async getUsage(userId: string): Promise<PlanUsageOutput> {
    const plan = await this.getUserPlan(userId);
    const limits = getPlanLimits(plan);

    const [activeForms, teamUsers, responsesThisMonth] = await Promise.all([
      this.countActiveForms(userId),
      this.countTeamUsers(userId),
      this.countResponsesThisMonth(userId),
    ]);

    return {
      plan,
      limits,
      usage: {
        activeForms,
        teamUsers,
        responsesThisMonth,
      },
      canCreateForm: activeForms < limits.maxForms,
      canAcceptResponse: responsesThisMonth < limits.maxResponsesPerMonth,
    };
  }

  public async assertCanCreateForm(userId: string): Promise<void> {
    const plan = await this.getUserPlan(userId);
    const limits = getPlanLimits(plan);
    const activeForms = await this.countActiveForms(userId);

    if (activeForms >= limits.maxForms) {
      const tierName = plan === "free" ? "Field Operative" : plan.replace(/_/g, " ");
      throw new PlanLimitError(
        "form_limit",
        plan,
        `Active dossier limit reached (${limits.maxForms} on ${tierName}). Upgrade your clearance tier to create more.`,
      );
    }
  }

  public async canAcceptResponse(formOwnerUserId: string): Promise<boolean> {
    const plan = await this.getUserPlan(formOwnerUserId);
    const limits = getPlanLimits(plan);
    const responsesThisMonth = await this.countResponsesThisMonth(formOwnerUserId);
    return responsesThisMonth < limits.maxResponsesPerMonth;
  }

  public async assertCanAcceptResponse(formOwnerUserId: string): Promise<void> {
    const ok = await this.canAcceptResponse(formOwnerUserId);
    if (ok) {
      return;
    }

    const plan = await this.getUserPlan(formOwnerUserId);
    const limits = getPlanLimits(plan);
    throw new PlanLimitError(
      "response_limit",
      plan,
      `Monthly response limit reached (${limits.maxResponsesPerMonth}). The form owner must upgrade their plan.`,
    );
  }
}

const billingService = new BillingService();
export default billingService;
export { BillingService, PlanLimitError };
