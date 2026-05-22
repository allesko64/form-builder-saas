import { planUsageSchema } from "@repo/services/billing/model";
import { zodUndefinedModel } from "../../schema";
import { billingService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { protectedOpenApi } from "../../utils/openapi-meta";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Billing"];
const getPath = generatePath("/billing");

export const billingRouter = router({
  usage: protectedProcedure
    .meta({
      openapi: protectedOpenApi({ method: "GET", path: getPath("/usage"), tags: TAGS }),
    })
    .input(zodUndefinedModel)
    .output(planUsageSchema)
    .query(async ({ ctx }) => {
      return billingService.getUsage(ctx.user!.id);
    }),
});
