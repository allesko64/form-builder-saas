import {
  createFieldInputSchema,
  deleteFieldOutputSchema,
  fieldIdInputSchema,
  formFieldOutputSchema,
  reorderFieldsInputSchema,
  updateFieldInputSchema,
} from "@repo/services/field/model";
import { invalidatePublicFormCache } from "@repo/services/public";
import { TRPCError } from "@trpc/server";
import { z } from "../../schema";
import { fieldService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { protectedOpenApi } from "../../utils/openapi-meta";

const TAGS = ["Fields"];
const getPath = generatePath("/fields");

function notFound(message = "Field or form not found"): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export const fieldRouter = router({
  create: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "POST", path: getPath(""), tags: TAGS }) })
    .input(createFieldInputSchema)
    .output(formFieldOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const field = await fieldService.create(ctx.user!.id, input);
      if (!field) notFound();
      await invalidatePublicFormCache(ctx.redis, input.formId);
      return field;
    }),

  update: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "PATCH", path: getPath("/:id"), tags: TAGS }) })
    .input(updateFieldInputSchema)
    .output(formFieldOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const field = await fieldService.update(ctx.user!.id, input);
      if (!field) notFound();
      await invalidatePublicFormCache(ctx.redis, field.formId);
      return field;
    }),

  delete: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "DELETE", path: getPath("/:id"), tags: TAGS }) })
    .input(fieldIdInputSchema)
    .output(deleteFieldOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await fieldService.delete(ctx.user!.id, input.id);
      if (!result) notFound();
      await invalidatePublicFormCache(ctx.redis, result.formId);
      return result;
    }),

  reorder: protectedProcedure
    .meta({ openapi: protectedOpenApi({ method: "PUT", path: getPath("/reorder"), tags: TAGS }) })
    .input(reorderFieldsInputSchema)
    .output(z.array(formFieldOutputSchema))
    .mutation(async ({ ctx, input }) => {
      const fields = await fieldService.reorder(ctx.user!.id, input);
      if (!fields) notFound("Form not found or invalid field order");
      await invalidatePublicFormCache(ctx.redis, input.formId);
      return fields;
    }),
});
