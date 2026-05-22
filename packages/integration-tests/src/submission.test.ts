import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";

import { db, eq } from "@repo/database";
import { formsTable } from "@repo/database/schema";
import { cleanupForm, cleanupUser, createPublishedForm, createTestUser } from "./helpers/fixtures";
import { publicService } from "./helpers/services";

describe("public submission (integration)", () => {
  const owner = { id: "" };
  const form = { formId: "", fieldId: "" };

  afterEach(async () => {
    if (form.formId) await cleanupForm(form.formId);
    if (owner.id) await cleanupUser(owner.id);
  });

  it("accepts valid submissions and rejects invalid payloads", async () => {
    const user = await createTestUser();
    owner.id = user.id;

    const created = await createPublishedForm(user.id);
    form.formId = created.formId;
    form.fieldId = created.fieldId;

    const terminalHash = `terminal-${randomUUID()}`;

    const ok = await publicService.submit(
      {
        formId: form.formId,
        submissionId: randomUUID(),
        answers: { [form.fieldId]: "Valid answer" },
        completionTimeMs: 3000,
      },
      { terminalHash, userAgent: "integration-test", submitterEmail: null },
    );

    assert.deepEqual(ok, { success: true });

    const bad = await publicService.submit(
      {
        formId: form.formId,
        submissionId: randomUUID(),
        answers: {},
      },
      {
        terminalHash: `other-${randomUUID()}`,
        userAgent: "integration-test",
        submitterEmail: null,
      },
    );

    assert.ok(bad && "error" in bad && bad.error === "validation");
  });

  it("enforces response limits under sequential submits", async () => {
    const user = await createTestUser();
    owner.id = user.id;

    const created = await createPublishedForm(user.id);
    form.formId = created.formId;
    form.fieldId = created.fieldId;

    await db.update(formsTable).set({ responseLimit: 1 }).where(eq(formsTable.id, form.formId));

    const first = await publicService.submit(
      {
        formId: form.formId,
        submissionId: randomUUID(),
        answers: { [form.fieldId]: "One" },
      },
      { terminalHash: `t-${randomUUID()}`, userAgent: null, submitterEmail: null },
    );
    assert.deepEqual(first, { success: true });

    const second = await publicService.submit(
      {
        formId: form.formId,
        submissionId: randomUUID(),
        answers: { [form.fieldId]: "Two" },
      },
      { terminalHash: `t-${randomUUID()}`, userAgent: null, submitterEmail: null },
    );
    assert.ok(second && "error" in second && second.error === "limit_reached");
  });
});
