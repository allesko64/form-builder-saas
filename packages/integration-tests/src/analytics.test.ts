import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";

import { db } from "@repo/database";
import { formFieldsTable, responsesTable } from "@repo/database/schema";
import { cleanupForm, cleanupUser, createPublishedForm, createTestUser } from "./helpers/fixtures";
import { analyticsService, publicService } from "./helpers/services";

describe("analytics queries (integration)", () => {
  const owner = { id: "" };
  const form = { formId: "" };

  afterEach(async () => {
    if (form.formId) await cleanupForm(form.formId);
    if (owner.id) await cleanupUser(owner.id);
  });

  it("computes dropoff and funnel from sessions and responses", async () => {
    const user = await createTestUser();
    owner.id = user.id;

    const created = await createPublishedForm(user.id);
    form.formId = created.formId;

    const sessionKey = `sess-${randomUUID()}`;
    await publicService.recordFunnelProgress({ formId: form.formId, stepIndex: 0 }, sessionKey);
    await publicService.recordFunnelProgress({ formId: form.formId, stepIndex: 1 }, sessionKey);

    const otherSession = `sess-${randomUUID()}`;
    await publicService.recordFunnelProgress({ formId: form.formId, stepIndex: 0 }, otherSession);

    await db.insert(responsesTable).values({
      formId: form.formId,
      submissionId: randomUUID(),
      answers: { [created.fieldId]: "Alice" },
      ipHash: `hash-${randomUUID()}`,
      userAgent: "integration-test",
      completionTimeMs: 5000,
    });

    const dropoff = await analyticsService.dropoff(user.id, form.formId);
    assert.ok(dropoff);
    assert.ok(dropoff.formStarts >= 2);
    assert.equal(dropoff.submissions, 1);
    assert.ok(dropoff.dropoffRate > 0);

    const funnel = await analyticsService.funnel(user.id, form.formId);
    assert.ok(funnel);
    assert.ok(funnel.steps.length >= 3);
    assert.equal(funnel.steps[0]?.label, "Form opened");
    assert.equal(funnel.steps.at(-1)?.label, "Submitted");
    assert.equal(funnel.steps.at(-1)?.reached, 1);

    const overview = await analyticsService.overview(user.id, form.formId);
    assert.ok(overview);
    assert.equal(overview.totalResponses, 1);
    assert.equal(overview.dropoffRate, dropoff.dropoffRate);
  });

  it("returns rating distribution counts together with the average", async () => {
    const user = await createTestUser();
    owner.id = user.id;

    const created = await createPublishedForm(user.id);
    form.formId = created.formId;

    const ratingFieldId = randomUUID();
    await db.insert(formFieldsTable).values({
      id: ratingFieldId,
      formId: form.formId,
      label: "Satisfaction",
      type: "rating",
      required: true,
      sortOrder: 1,
      validationConfig: { max: 5 },
      visibilityConfig: null,
    });

    for (const rating of [1, 4, 4]) {
      await db.insert(responsesTable).values({
        formId: form.formId,
        submissionId: randomUUID(),
        answers: { [ratingFieldId]: rating },
        ipHash: `hash-${randomUUID()}`,
        userAgent: "integration-test",
      });
    }

    const byField = await analyticsService.byField(user.id, form.formId);
    const ratingStats = byField?.find((item) => item.fieldId === ratingFieldId)?.stats;

    assert.ok(ratingStats);
    assert.equal(ratingStats.average, 3);
    assert.deepEqual(ratingStats.optionCounts, { "1": 1, "4": 2 });
  });

  it("returns null analytics for forms not owned by user", async () => {
    const ownerUser = await createTestUser("owner");
    const otherUser = await createTestUser("other");
    owner.id = ownerUser.id;

    const created = await createPublishedForm(ownerUser.id);
    form.formId = created.formId;

    assert.equal(await analyticsService.funnel(otherUser.id, form.formId), null);

    await cleanupUser(otherUser.id);
  });
});
