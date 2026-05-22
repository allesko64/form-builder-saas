import { and, asc, count, db, desc, eq, inArray, isNull } from "@repo/database";
import { formFieldsTable, formsTable, responsesTable } from "@repo/database/schema";

import billingService from "../billing";

import type {
  CreateFormInput,
  DeleteFormOutput,
  FormListItemOutput,
  FormOutput,
  GetFormByIdOutput,
  PublishFormInput,
  UpdateFormInput,
} from "./model";
import { slugifyTitle, slugWithSuffix } from "./slug";

function toFormOutput(form: typeof formsTable.$inferSelect): FormOutput {
  return {
    id: form.id,
    userId: form.userId,
    title: form.title,
    description: form.description,
    slug: form.slug,
    status: form.status,
    theme: form.theme ?? null,
    submitButtonText: form.submitButtonText ?? "Submit",
    successMessage: form.successMessage ?? null,
    responseLimit: form.responseLimit ?? null,
    expiresAt: form.expiresAt ?? null,
    collectRespondentEmail: form.collectRespondentEmail ?? false,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  };
}

class FormService {
  public async create(userId: string, input: CreateFormInput): Promise<FormOutput> {
    await billingService.assertCanCreateForm(userId);

    const slug = await this.resolveUniqueSlug(input.title);

    const [form] = await db
      .insert(formsTable)
      .values({
        userId,
        title: input.title,
        description: input.description ?? null,
        slug,
      })
      .returning();

    if (!form) {
      throw new Error("Failed to create form");
    }

    return toFormOutput(form);
  }

  public async list(userId: string): Promise<FormListItemOutput[]> {
    const forms = await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.userId, userId), isNull(formsTable.deletedAt)))
      .orderBy(desc(formsTable.createdAt));

    if (forms.length === 0) {
      return [];
    }

    const formIds = forms.map((f) => f.id);
    const [responseCountRows, fieldCountRows] = await Promise.all([
      db
        .select({
          formId: responsesTable.formId,
          responseCount: count(),
        })
        .from(responsesTable)
        .where(inArray(responsesTable.formId, formIds))
        .groupBy(responsesTable.formId),
      db
        .select({
          formId: formFieldsTable.formId,
          fieldCount: count(),
        })
        .from(formFieldsTable)
        .where(inArray(formFieldsTable.formId, formIds))
        .groupBy(formFieldsTable.formId),
    ]);

    const responseCountByFormId = new Map(
      responseCountRows.map((row) => [row.formId, Number(row.responseCount)]),
    );
    const fieldCountByFormId = new Map(
      fieldCountRows.map((row) => [row.formId, Number(row.fieldCount)]),
    );

    return forms.map((form) => ({
      ...toFormOutput(form),
      responseCount: responseCountByFormId.get(form.id) ?? 0,
      fieldCount: fieldCountByFormId.get(form.id) ?? 0,
    }));
  }

  public async getById(formId: string, userId: string): Promise<GetFormByIdOutput | null> {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(
        and(eq(formsTable.id, formId), eq(formsTable.userId, userId), isNull(formsTable.deletedAt)),
      )
      .limit(1);

    if (!form) {
      return null;
    }

    const fields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, form.id))
      .orderBy(asc(formFieldsTable.sortOrder));

    return {
      ...toFormOutput(form),
      fields,
    };
  }

  public async update(userId: string, input: UpdateFormInput): Promise<FormOutput | null> {
    const owned = await this.findOwnedForm(userId, input.id);
    if (!owned) {
      return null;
    }

    const updates: Partial<typeof formsTable.$inferInsert> = {};

    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.theme !== undefined) updates.theme = input.theme;
    if (input.submitButtonText !== undefined) {
      updates.submitButtonText = input.submitButtonText;
    }
    if (input.successMessage !== undefined) updates.successMessage = input.successMessage;
    if (input.responseLimit !== undefined) updates.responseLimit = input.responseLimit;
    if (input.expiresAt !== undefined) updates.expiresAt = input.expiresAt;
    if (input.collectRespondentEmail !== undefined) {
      updates.collectRespondentEmail = input.collectRespondentEmail;
    }

    const [form] = await db
      .update(formsTable)
      .set(updates)
      .where(eq(formsTable.id, input.id))
      .returning();

    if (!form) {
      return null;
    }

    return toFormOutput(form);
  }

  public async delete(userId: string, formId: string): Promise<DeleteFormOutput | null> {
    const owned = await this.findOwnedForm(userId, formId);
    if (!owned) {
      return null;
    }

    await db.update(formsTable).set({ deletedAt: new Date() }).where(eq(formsTable.id, formId));

    return { success: true as const };
  }

  public async publish(
    userId: string,
    input: PublishFormInput,
  ): Promise<FormOutput | null | { error: "no_fields" }> {
    const owned = await this.findOwnedForm(userId, input.id);
    if (!owned) {
      return null;
    }

    const [fieldCountRow] = await db
      .select({ total: count() })
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, input.id));

    if (Number(fieldCountRow?.total ?? 0) === 0) {
      return { error: "no_fields" };
    }

    const [form] = await db
      .update(formsTable)
      .set({ status: input.status })
      .where(eq(formsTable.id, input.id))
      .returning();

    if (!form) {
      return null;
    }

    return toFormOutput(form);
  }

  public async unpublish(userId: string, formId: string): Promise<FormOutput | null> {
    const owned = await this.findOwnedForm(userId, formId);
    if (!owned) {
      return null;
    }

    const [form] = await db
      .update(formsTable)
      .set({ status: "draft" })
      .where(eq(formsTable.id, formId))
      .returning();

    if (!form) {
      return null;
    }

    return toFormOutput(form);
  }

  public async duplicate(userId: string, formId: string): Promise<GetFormByIdOutput | null> {
    await billingService.assertCanCreateForm(userId);

    const [source] = await db
      .select()
      .from(formsTable)
      .where(
        and(eq(formsTable.id, formId), eq(formsTable.userId, userId), isNull(formsTable.deletedAt)),
      )
      .limit(1);

    if (!source) {
      return null;
    }

    const sourceFields = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, source.id))
      .orderBy(asc(formFieldsTable.sortOrder));

    const copyTitle =
      source.title.length <= 192
        ? `Copy of ${source.title}`
        : `Copy of ${source.title.slice(0, 192)}`;
    const slug = await this.resolveUniqueSlug(copyTitle);

    return db.transaction(async (tx) => {
      const [newForm] = await tx
        .insert(formsTable)
        .values({
          userId,
          title: copyTitle,
          description: source.description,
          slug,
          status: "draft",
          theme: source.theme,
          submitButtonText: source.submitButtonText,
          successMessage: source.successMessage,
          responseLimit: source.responseLimit,
          expiresAt: source.expiresAt,
          collectRespondentEmail: source.collectRespondentEmail,
        })
        .returning();

      if (!newForm) {
        throw new Error("Failed to duplicate form");
      }

      let fields: (typeof formFieldsTable.$inferSelect)[] = [];

      if (sourceFields.length > 0) {
        fields = await tx
          .insert(formFieldsTable)
          .values(
            sourceFields.map((field) => ({
              formId: newForm.id,
              label: field.label,
              placeholder: field.placeholder,
              helpText: field.helpText,
              type: field.type,
              required: field.required,
              sortOrder: field.sortOrder,
              validationConfig: field.validationConfig,
            })),
          )
          .returning();
      }

      return {
        ...toFormOutput(newForm),
        fields,
      };
    });
  }

  private async findOwnedForm(userId: string, formId: string) {
    const [form] = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(
        and(eq(formsTable.id, formId), eq(formsTable.userId, userId), isNull(formsTable.deletedAt)),
      )
      .limit(1);

    return form ?? null;
  }

  private async resolveUniqueSlug(title: string): Promise<string> {
    const base = slugifyTitle(title);

    for (let suffix = 1; suffix <= 999; suffix++) {
      const candidate = slugWithSuffix(base, suffix);
      const exists = await this.slugExists(candidate);
      if (!exists) {
        return candidate;
      }
    }

    throw new Error("Could not generate a unique slug");
  }

  private async slugExists(slug: string): Promise<boolean> {
    const [row] = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(eq(formsTable.slug, slug))
      .limit(1);

    return row !== undefined;
  }
}

export default FormService;
