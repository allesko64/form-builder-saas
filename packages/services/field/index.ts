import { and, asc, db, eq, isNull } from "@repo/database";
import { formFieldsTable, formsTable } from "@repo/database/schema";

import type {
  CreateFieldInput,
  DeleteFieldOutput,
  FormFieldOutput,
  ReorderFieldsInput,
  UpdateFieldInput,
} from "./model";

class FieldService {
  public async create(userId: string, input: CreateFieldInput): Promise<FormFieldOutput | null> {
    if (!(await this.isFormOwned(userId, input.formId))) {
      return null;
    }

    const sortOrder = input.sortOrder ?? (await this.nextSortOrder(input.formId));

    const [field] = await db
      .insert(formFieldsTable)
      .values({
        formId: input.formId,
        label: input.label,
        type: input.type,
        required: input.required ?? false,
        placeholder: input.placeholder ?? null,
        helpText: input.helpText ?? null,
        sortOrder,
        validationConfig: input.validationConfig ?? null,
        visibilityConfig: input.visibilityConfig ?? null,
      })
      .returning();

    if (!field) {
      throw new Error("Failed to create field");
    }

    return field;
  }

  public async update(userId: string, input: UpdateFieldInput): Promise<FormFieldOutput | null> {
    const owned = await this.findOwnedField(userId, input.id);
    if (!owned) {
      return null;
    }

    const updates: Partial<typeof formFieldsTable.$inferInsert> = {};

    if (input.label !== undefined) updates.label = input.label;
    if (input.type !== undefined) updates.type = input.type;
    if (input.required !== undefined) updates.required = input.required;
    if (input.placeholder !== undefined) updates.placeholder = input.placeholder;
    if (input.helpText !== undefined) updates.helpText = input.helpText;
    if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
    if (input.validationConfig !== undefined) {
      updates.validationConfig = input.validationConfig;
    }
    if (input.visibilityConfig !== undefined) {
      updates.visibilityConfig = input.visibilityConfig;
    }

    const [field] = await db
      .update(formFieldsTable)
      .set(updates)
      .where(eq(formFieldsTable.id, input.id))
      .returning();

    if (!field) {
      return null;
    }

    return field;
  }

  public async delete(userId: string, fieldId: string): Promise<DeleteFieldOutput | null> {
    const owned = await this.findOwnedFieldWithFormId(userId, fieldId);
    if (!owned) {
      return null;
    }

    await db.delete(formFieldsTable).where(eq(formFieldsTable.id, fieldId));

    return { success: true as const, formId: owned.formId };
  }

  public async reorder(
    userId: string,
    input: ReorderFieldsInput,
  ): Promise<FormFieldOutput[] | null> {
    if (!(await this.isFormOwned(userId, input.formId))) {
      return null;
    }

    const existing = await db
      .select({ id: formFieldsTable.id })
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, input.formId));

    const existingIds = new Set(existing.map((row) => row.id));

    if (input.order.length !== existingIds.size) {
      return null;
    }

    for (const { id } of input.order) {
      if (!existingIds.has(id)) {
        return null;
      }
    }

    await db.transaction(async (tx) => {
      for (const { id, sortOrder } of input.order) {
        await tx
          .update(formFieldsTable)
          .set({ sortOrder })
          .where(and(eq(formFieldsTable.id, id), eq(formFieldsTable.formId, input.formId)));
      }
    });

    return db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, input.formId))
      .orderBy(asc(formFieldsTable.sortOrder));
  }

  private async isFormOwned(userId: string, formId: string): Promise<boolean> {
    const [form] = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(
        and(eq(formsTable.id, formId), eq(formsTable.userId, userId), isNull(formsTable.deletedAt)),
      )
      .limit(1);

    return form !== undefined;
  }

  private async findOwnedField(userId: string, fieldId: string): Promise<{ id: string } | null> {
    const row = await this.findOwnedFieldWithFormId(userId, fieldId);
    return row ? { id: row.id } : null;
  }

  private async findOwnedFieldWithFormId(
    userId: string,
    fieldId: string,
  ): Promise<{ id: string; formId: string } | null> {
    const [row] = await db
      .select({ id: formFieldsTable.id, formId: formFieldsTable.formId })
      .from(formFieldsTable)
      .innerJoin(formsTable, eq(formFieldsTable.formId, formsTable.id))
      .where(
        and(
          eq(formFieldsTable.id, fieldId),
          eq(formsTable.userId, userId),
          isNull(formsTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private async nextSortOrder(formId: string): Promise<number> {
    const rows = await db
      .select({ sortOrder: formFieldsTable.sortOrder })
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, formId));

    if (rows.length === 0) {
      return 0;
    }

    return Math.max(...rows.map((row) => row.sortOrder)) + 1;
  }
}

export default FieldService;
