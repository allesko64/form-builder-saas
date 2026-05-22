import { and, asc, db, eq, isNull, sql } from "@repo/database";
import { formFieldsTable, formFunnelSessionsTable, formsTable } from "@repo/database/schema";
import { emailService, formatAnswerValue } from "@repo/email";
import { logger } from "@repo/logger";
import billingService from "../billing";
import ResponseService from "../response";
import { buildZodSchema } from "@repo/validators";
import type { ZodError } from "zod";

import type { Redis } from "ioredis";

import {
  formIdCacheKey,
  formSlugCacheKey,
  getCachedPublicForm,
  setCachedPublicForm,
} from "./cache";
import type {
  GetPublicFormInput,
  GetSubmissionInput,
  PublicExploreForm,
  PublicForm,
  PublicSubmission,
  RecordFunnelProgressInput,
  SubmitFormInput,
  SubmitFormOutput,
} from "./model";

const responseService = new ResponseService();

export type SubmitContext = {
  /** Hashed terminal fingerprint (stored in `responses.ip_hash`). */
  terminalHash: string | null;
  userAgent: string | null;
  /** Signed-in submitter account email; null for anonymous public visitors. */
  submitterEmail: string | null;
};

export type SubmitResult =
  | SubmitFormOutput
  | {
      error: "not_found" | "forbidden" | "limit_reached" | "expired" | "already_submitted";
    }
  | { error: "validation"; issues: ZodError };

export type GetFormOptions = {
  terminalHash?: string | null;
};

class PublicService {
  public async getForm(
    input: GetPublicFormInput,
    redis: Redis | null = null,
    options: GetFormOptions = {},
  ): Promise<PublicForm | null> {
    if (redis) {
      const cacheKey =
        input.slug !== undefined ? formSlugCacheKey(input.slug) : formIdCacheKey(input.id!);

      const cached = await getCachedPublicForm(redis, cacheKey);
      if (cached) {
        const existingTerminalSubmissionId = options.terminalHash
          ? await responseService.getSubmissionIdByFormAndIpHash(cached.id, options.terminalHash)
          : null;
        return { ...cached, existingTerminalSubmissionId };
      }
    }

    const [form] = await db
      .select()
      .from(formsTable)
      .where(
        and(
          isNull(formsTable.deletedAt),
          input.slug !== undefined ? eq(formsTable.slug, input.slug) : eq(formsTable.id, input.id!),
        ),
      )
      .limit(1);

    if (!form || !this.isPubliclyAccessible(form.status)) {
      return null;
    }

    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, form.id))
      .orderBy(asc(formFieldsTable.sortOrder));

    let existingTerminalSubmissionId: string | null = null;
    if (options.terminalHash) {
      existingTerminalSubmissionId = await responseService.getSubmissionIdByFormAndIpHash(
        form.id,
        options.terminalHash,
      );
    }

    const publicForm = this.toPublicForm(form, fields, existingTerminalSubmissionId);

    if (redis) {
      await setCachedPublicForm(redis, {
        ...publicForm,
        existingTerminalSubmissionId: null,
      });
    }

    return publicForm;
  }

  public async getSubmission(input: GetSubmissionInput): Promise<PublicSubmission | null> {
    const form = await this.getForm({ slug: input.slug });
    if (!form) {
      return null;
    }

    const row = await responseService.getBySubmissionId(input.submissionId);
    if (!row || row.formId !== form.id) {
      return null;
    }

    return {
      submissionId: row.submissionId,
      formId: form.id,
      formTitle: form.title,
      formSlug: form.slug,
      answers: row.answers,
      createdAt: row.createdAt,
      completionTimeMs: row.completionTimeMs,
      fields: form.fields,
    };
  }

  public async getForms(): Promise<PublicExploreForm[]> {
    const forms = await db
      .select({
        id: formsTable.id,
        title: formsTable.title,
        description: formsTable.description,
        slug: formsTable.slug,
        theme: formsTable.theme,
        createdAt: formsTable.createdAt,
      })
      .from(formsTable)
      .where(and(eq(formsTable.status, "published_public"), isNull(formsTable.deletedAt)))
      .orderBy(asc(formsTable.createdAt));

    return forms;
  }

  public async submit(input: SubmitFormInput, ctx: SubmitContext): Promise<SubmitResult> {
    const form = await this.getSubmittableForm(input.formId);
    if (!form) {
      return { error: "not_found" };
    }

    if (form.status === "draft") {
      return { error: "forbidden" };
    }

    if (!this.isPubliclyAccessible(form.status)) {
      return { error: "not_found" };
    }

    if (form.expiresAt && form.expiresAt < new Date()) {
      return { error: "expired" };
    }

    const isDuplicate = await responseService.checkDuplicate(input.submissionId);
    if (isDuplicate) {
      return { success: true as const, deduplicated: true };
    }

    if (!ctx.terminalHash) {
      return { error: "already_submitted" };
    }

    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, input.formId))
      .orderBy(asc(formFieldsTable.sortOrder));

    if (fields.length === 0) {
      return { error: "forbidden" };
    }

    const schema = buildZodSchema(fields, input.answers);
    const parsed = schema.safeParse(input.answers);
    if (!parsed.success) {
      return { error: "validation", issues: parsed.error };
    }

    const validated = parsed.data as Record<string, string | number | boolean | string[] | null>;

    const respondentOptedIn = input.sendConfirmationEmail ?? true;
    const respondentEmail =
      form.collectRespondentEmail && ctx.submitterEmail && respondentOptedIn
        ? ctx.submitterEmail
        : null;

    const planAllowsResponse = await billingService.canAcceptResponse(form.userId);
    if (!planAllowsResponse) {
      return { error: "limit_reached" };
    }

    const insertResult = await responseService.createWithSubmissionGuards(
      {
        formId: input.formId,
        submissionId: input.submissionId,
        answers: validated,
        ipHash: ctx.terminalHash,
        userAgent: ctx.userAgent,
        completionTimeMs: input.completionTimeMs ?? null,
        respondentEmail,
      },
      { responseLimit: form.responseLimit, enforceTerminalDedup: true },
    );

    if (insertResult === "limit_reached") {
      return { error: "limit_reached" };
    }

    if (insertResult === "already_submitted") {
      return { error: "already_submitted" };
    }

    const submittedAt = new Date();
    const answersSummary = fields.map((field) => ({
      label: field.label,
      value: formatAnswerValue(validated[field.id]),
    }));

    if (respondentEmail) {
      const viewReportUrl = this.buildSubmissionReceiptUrl(form.slug, input.submissionId);
      emailService
        .notifyRespondent({
          email: respondentEmail,
          formTitle: form.title,
          submittedAt,
          answersSummary,
          viewReportUrl,
        })
        .catch((err) => logger.error("Failed to send respondent confirmation", err));
    }

    if (ctx.terminalHash) {
      await this.recordFunnelProgress(
        {
          formId: input.formId,
          stepIndex: fields.length,
          submitted: true,
        },
        ctx.terminalHash,
      );
    }

    return { success: true as const };
  }

  /** Tracks multi-step progress for dropoff / funnel analytics. */
  public async recordFunnelProgress(
    input: RecordFunnelProgressInput,
    sessionKey: string,
  ): Promise<{ ok: true } | null> {
    const form = await this.getSubmittableForm(input.formId);
    if (!form || !this.isPubliclyAccessible(form.status)) {
      return null;
    }

    const now = new Date();

    await db
      .insert(formFunnelSessionsTable)
      .values({
        formId: input.formId,
        sessionKey,
        maxStepReached: input.stepIndex,
        submitted: input.submitted ?? false,
        startedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [formFunnelSessionsTable.formId, formFunnelSessionsTable.sessionKey],
        set: {
          maxStepReached: sql`GREATEST(${formFunnelSessionsTable.maxStepReached}, ${input.stepIndex})`,
          submitted: sql`(${formFunnelSessionsTable.submitted} OR excluded.submitted)`,
          updatedAt: now,
        },
      });

    return { ok: true as const };
  }

  private async getSubmittableForm(formId: string) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.id, formId), isNull(formsTable.deletedAt)))
      .limit(1);

    return form ?? null;
  }

  private buildSubmissionReceiptUrl(slug: string, submissionId: string): string | undefined {
    const base = process.env.WEB_APP_URL ?? process.env.NEXT_PUBLIC_WEB_APP_URL;
    if (!base) return undefined;
    const normalized = base.replace(/\/$/, "");
    return `${normalized}/f/${slug}/submission/${submissionId}`;
  }

  private isPubliclyAccessible(status: (typeof formsTable.$inferSelect)["status"]): boolean {
    return status === "published_public" || status === "published_unlisted";
  }

  private toPublicForm(
    form: typeof formsTable.$inferSelect,
    fields: (typeof formFieldsTable.$inferSelect)[],
    existingTerminalSubmissionId: string | null = null,
  ): PublicForm {
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      slug: form.slug,
      theme: form.theme,
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage,
      collectRespondentEmail: form.collectRespondentEmail,
      fields,
      existingTerminalSubmissionId,
    };
  }
}

export default PublicService;
export { invalidatePublicFormCache } from "./cache";
