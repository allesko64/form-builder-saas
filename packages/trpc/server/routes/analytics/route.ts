import {
  analyticsByDaySchema,
  analyticsByFieldSchema,
  analyticsDropoffSchema,
  analyticsFormIdSchema,
  analyticsFunnelSchema,
  analyticsOverviewSchema,
  exportCsvOutputSchema,
  listResponsesInputSchema,
  listResponsesOutputSchema,
} from "@repo/services/analytics/model";
import { TRPCError } from "@trpc/server";
import { analyticsService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { protectedOpenApi } from "../../utils/openapi-meta";

const TAGS = ["Analytics"];
const getPath = generatePath("/analytics");

function notFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
}

export const analyticsRouter = router({
  overview: protectedProcedure
    .meta({
      openapi: protectedOpenApi({ method: "GET", path: getPath("/:formId/overview"), tags: TAGS }),
    })
    .input(analyticsFormIdSchema)
    .output(analyticsOverviewSchema)
    .query(async ({ ctx, input }) => {
      const stats = await analyticsService.overview(ctx.user!.id, input.formId);
      if (!stats) notFound();
      return stats;
    }),

  byDay: protectedProcedure
    .meta({
      openapi: protectedOpenApi({ method: "GET", path: getPath("/:formId/by-day"), tags: TAGS }),
    })
    .input(analyticsFormIdSchema)
    .output(analyticsByDaySchema)
    .query(async ({ ctx, input }) => {
      const data = await analyticsService.byDay(ctx.user!.id, input.formId);
      if (!data) notFound();
      return data;
    }),

  dropoff: protectedProcedure
    .meta({
      openapi: protectedOpenApi({
        method: "GET",
        path: getPath("/:formId/dropoff"),
        tags: TAGS,
      }),
    })
    .input(analyticsFormIdSchema)
    .output(analyticsDropoffSchema)
    .query(async ({ ctx, input }) => {
      const data = await analyticsService.dropoff(ctx.user!.id, input.formId);
      if (!data) notFound();
      return data;
    }),

  funnel: protectedProcedure
    .meta({
      openapi: protectedOpenApi({
        method: "GET",
        path: getPath("/:formId/funnel"),
        tags: TAGS,
      }),
    })
    .input(analyticsFormIdSchema)
    .output(analyticsFunnelSchema)
    .query(async ({ ctx, input }) => {
      const data = await analyticsService.funnel(ctx.user!.id, input.formId);
      if (!data) notFound();
      return data;
    }),

  byField: protectedProcedure
    .meta({
      openapi: protectedOpenApi({ method: "GET", path: getPath("/:formId/by-field"), tags: TAGS }),
    })
    .input(analyticsFormIdSchema)
    .output(analyticsByFieldSchema)
    .query(async ({ ctx, input }) => {
      const data = await analyticsService.byField(ctx.user!.id, input.formId);
      if (!data) notFound();
      return data;
    }),

  responses: protectedProcedure
    .meta({
      openapi: protectedOpenApi({ method: "GET", path: getPath("/:formId/responses"), tags: TAGS }),
    })
    .input(listResponsesInputSchema)
    .output(listResponsesOutputSchema)
    .query(async ({ ctx, input }) => {
      const data = await analyticsService.responses(ctx.user!.id, input);
      if (!data) notFound();
      return data;
    }),

  exportCsv: protectedProcedure
    .meta({
      openapi: protectedOpenApi({
        method: "GET",
        path: getPath("/:formId/export-csv"),
        tags: TAGS,
      }),
    })
    .input(analyticsFormIdSchema)
    .output(exportCsvOutputSchema)
    .query(async ({ ctx, input }) => {
      const data = await analyticsService.exportCsv(ctx.user!.id, input.formId);
      if (!data) notFound();
      return data;
    }),
});
