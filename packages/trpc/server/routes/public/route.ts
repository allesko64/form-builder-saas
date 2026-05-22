import { notifyAnalyticsResponse } from "@repo/realtime";
import {
  getPublicFormInputSchema,
  getSubmissionInputSchema,
  recordFunnelProgressInputSchema,
  recordFunnelProgressOutputSchema,
  publicExploreFormSchema,
  publicFormSchema,
  publicSubmissionSchema,
  submitFormInputSchema,
  submitFormOutputSchema,
} from "@repo/services/public/model";
import { TRPCError } from "@trpc/server";
import { z, zodUndefinedModel } from "../../schema";
import { enforceSubmissionRateLimit } from "../../middleware/rate-limit";
import { publicService } from "../../services";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Public"];
const getPath = generatePath("/public");

function notFound(message = "Form not found"): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export const publicRouter = router({
  getForm: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/forms"), tags: TAGS } })
    .input(getPublicFormInputSchema)
    .output(publicFormSchema)
    .query(async ({ ctx, input }) => {
      const form = await publicService.getForm(input, ctx.redis, {
        terminalHash: ctx.terminalHash,
      });
      if (!form) notFound();
      return form;
    }),

  getForms: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/forms/explore"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(publicExploreFormSchema))
    .query(async () => {
      return publicService.getForms();
    }),

  getSubmission: publicProcedure
    .meta({
      openapi: { method: "GET", path: getPath("/forms/submission"), tags: TAGS },
    })
    .input(getSubmissionInputSchema)
    .output(publicSubmissionSchema)
    .query(async ({ input }) => {
      const submission = await publicService.getSubmission(input);
      if (!submission) notFound("Submission not found");
      return submission;
    }),

  submit: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/forms/submit"), tags: TAGS } })
    .input(submitFormInputSchema)
    .output(submitFormOutputSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceSubmissionRateLimit(ctx.redis, ctx.terminalHash, input.formId);

      const result = await publicService.submit(input, {
        terminalHash: ctx.terminalHash,
        userAgent: ctx.userAgent,
        submitterEmail: ctx.user?.email ?? null,
      });

      if ("error" in result) {
        switch (result.error) {
          case "not_found":
            notFound();
          case "forbidden":
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "This form is not accepting responses",
            });
          case "expired":
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "This form has expired",
            });
          case "limit_reached":
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "This form has reached its response limit",
            });
          case "already_submitted":
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You have already submitted a response to this form from this terminal",
            });
          case "validation":
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Validation failed",
              cause: result.issues,
            });
        }
      }

      void notifyAnalyticsResponse(input.formId, ctx.redis).catch(() => {
        /* live analytics is best-effort */
      });

      return result;
    }),

  recordFunnelProgress: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/forms/funnel-progress"),
        tags: TAGS,
      },
    })
    .input(recordFunnelProgressInputSchema)
    .output(recordFunnelProgressOutputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.terminalHash) {
        return { ok: true as const };
      }

      const result = await publicService.recordFunnelProgress(input, ctx.terminalHash);

      if (!result) {
        notFound();
      }

      return result;
    }),
});
