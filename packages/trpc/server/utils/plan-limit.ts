import { PlanLimitError } from "@repo/services/billing/model";
import { TRPCError } from "@trpc/server";

export function rethrowPlanLimitError(error: unknown): never {
  if (error instanceof PlanLimitError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
    });
  }

  throw error;
}
