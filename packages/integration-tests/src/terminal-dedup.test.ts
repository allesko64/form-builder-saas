import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";

import { cleanupForm, cleanupUser, createPublishedForm, createTestUser } from "./helpers/fixtures";
import { responseService } from "./helpers/services";

describe("terminal dedup (integration)", () => {
  const owner = { id: "" };
  const form = { formId: "", fieldId: "" };

  afterEach(async () => {
    if (form.formId) await cleanupForm(form.formId);
    if (owner.id) await cleanupUser(owner.id);
  });

  it("rejects a second submission from the same terminal hash", async () => {
    const user = await createTestUser();
    owner.id = user.id;

    const created = await createPublishedForm(user.id);
    form.formId = created.formId;
    form.fieldId = created.fieldId;

    const terminalHash = `terminal-${randomUUID()}`;
    const base = {
      formId: form.formId,
      answers: { [form.fieldId]: "first" },
      ipHash: terminalHash,
      userAgent: "integration-test",
      completionTimeMs: 1200,
      respondentEmail: null,
    };

    const first = await responseService.createWithSubmissionGuards(
      { ...base, submissionId: randomUUID() },
      { responseLimit: null, enforceTerminalDedup: true },
    );
    assert.equal(first, "created");

    const second = await responseService.createWithSubmissionGuards(
      { ...base, submissionId: randomUUID() },
      { responseLimit: null, enforceTerminalDedup: true },
    );
    assert.equal(second, "already_submitted");
  });

  it("deduplicates by submission id before insert", async () => {
    const user = await createTestUser();
    owner.id = user.id;

    const created = await createPublishedForm(user.id);
    form.formId = created.formId;
    form.fieldId = created.fieldId;

    const submissionId = randomUUID();
    assert.equal(await responseService.checkDuplicate(submissionId), false);

    await responseService.create({
      formId: form.formId,
      submissionId,
      answers: { [form.fieldId]: "once" },
      ipHash: null,
      userAgent: null,
    });

    assert.equal(await responseService.checkDuplicate(submissionId), true);
  });
});
