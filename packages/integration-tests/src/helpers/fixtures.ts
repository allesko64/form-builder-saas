import { randomUUID } from "node:crypto";

import { db, eq } from "@repo/database";
import {
  formFieldsTable,
  formFunnelSessionsTable,
  formsTable,
  responsesTable,
  user,
} from "@repo/database/schema";

export async function createTestUser(label?: string) {
  const suffix = `${label ?? "user"}-${randomUUID().slice(0, 8)}`;
  const email = `test-${suffix}@integration.local`;
  const id = randomUUID();

  await db.insert(user).values({
    id,
    name: "Integration Test User",
    email,
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id, email };
}

export async function createPublishedForm(ownerUserId: string) {
  const formId = randomUUID();
  const fieldId = randomUUID();
  const slug = `test-form-${randomUUID().slice(0, 8)}`;

  await db.insert(formsTable).values({
    id: formId,
    userId: ownerUserId,
    title: "Integration Test Form",
    description: "Test",
    slug,
    status: "published_public",
    collectRespondentEmail: false,
    submitButtonText: "Submit",
    successMessage: "Thanks",
  });

  await db.insert(formFieldsTable).values({
    id: fieldId,
    formId,
    label: "Name",
    type: "short_text",
    required: true,
    sortOrder: 0,
    validationConfig: null,
    visibilityConfig: null,
  });

  return { formId, fieldId, slug };
}

export async function cleanupForm(formId: string) {
  await db.delete(responsesTable).where(eq(responsesTable.formId, formId));
  try {
    await db.delete(formFunnelSessionsTable).where(eq(formFunnelSessionsTable.formId, formId));
  } catch {
    /* table may be absent on older databases */
  }
  await db.delete(formFieldsTable).where(eq(formFieldsTable.formId, formId));
  await db.delete(formsTable).where(eq(formsTable.id, formId));
}

export async function cleanupUser(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}
