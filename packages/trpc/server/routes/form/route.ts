import {
  createFormInputSchema,
  deleteFormOutputSchema,
  formIdInputSchema,
  formListItemOutputSchema,
  formOutputSchema,
  getFormByIdOutputSchema,
  publishFormInputSchema,
  updateFormInputSchema,
} from "@repo/services/form/model";
import { invalidatePublicFormCache } from "@repo/services/public";
import { TRPCError } from "@trpc/server";
import { z, zodUndefinedModel } from "../../schema";
import { formService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { rethrowPlanLimitError } from "../../utils/plan-limit";
import { protectedOpenApi } from "../../utils/openapi-meta";

const TAGS = ["Forms"];
const getPath = generatePath("/forms");

function notFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
}

export const formRouter = router({
  create: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "POST", path: getPath(""), tags: TAGS }) })
    .input(createFormInputSchema)
    .output(formOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await formService.create(ctx.user!.id, input);
      } catch (error) {
        rethrowPlanLimitError(error);
      }
    }),

  list: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "GET", path: getPath(""), tags: TAGS }) })
    .input(zodUndefinedModel)
    .output(z.array(formListItemOutputSchema))
    .query(async ({ ctx }) => {
      return formService.list(ctx.user!.id);
    }),

  getById: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "GET", path: getPath("/:id"), tags: TAGS }) })
    .input(formIdInputSchema)
    .output(getFormByIdOutputSchema)
    .query(async ({ ctx, input }) => {
      const form = await formService.getById(input.id, ctx.user!.id);
      if (!form) notFound();
      return form;
    }),

  update: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "PATCH", path: getPath("/:id"), tags: TAGS }) })
    .input(updateFormInputSchema)
    .output(formOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const form = await formService.update(ctx.user!.id, input);
      if (!form) notFound();
      await invalidatePublicFormCache(ctx.redis, form.id, form.slug);
      return form;
    }),

  delete: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "DELETE", path: getPath("/:id"), tags: TAGS }) })
    .input(formIdInputSchema)
    .output(deleteFormOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await formService.delete(ctx.user!.id, input.id);
      if (!result) notFound();
      await invalidatePublicFormCache(ctx.redis, input.id);
      return result;
    }),

  publish: protectedProcedure
    .meta({
      openapi: protectedOpenApi({ method: "POST", path: getPath("/:id/publish"), tags: TAGS }),
    })
    .input(publishFormInputSchema)
    .output(formOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await formService.publish(ctx.user!.id, input);
      if (!result) {
        notFound();
      }
      if ("error" in result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add at least one field before publishing this dossier",
        });
      }
      await invalidatePublicFormCache(ctx.redis, result.id, result.slug);
      return result;
    }),

  unpublish: protectedProcedure
    .meta({
      openapi: protectedOpenApi({ method: "POST", path: getPath("/:id/unpublish"), tags: TAGS }),
    })
    .input(formIdInputSchema)
    .output(formOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const form = await formService.unpublish(ctx.user!.id, input.id);
      if (!form) notFound();
      await invalidatePublicFormCache(ctx.redis, form.id, form.slug);
      return form;
    }),

  duplicate: protectedProcedure
    .meta({
      openapi: protectedOpenApi({ method: "POST", path: getPath("/:id/duplicate"), tags: TAGS }),
    })
    .input(formIdInputSchema)
    .output(getFormByIdOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const form = await formService.duplicate(ctx.user!.id, input.id);
        if (!form) notFound();
        await invalidatePublicFormCache(ctx.redis, input.id);
        return form;
      } catch (error) {
        rethrowPlanLimitError(error);
      }
    }),
});
