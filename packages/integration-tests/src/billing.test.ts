import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { PlanLimitError } from "@repo/services/billing/model";
import FormService from "@repo/services/form";

import { cleanupForm, cleanupUser, createTestUser } from "./helpers/fixtures.js";

describe("billing plan limits (integration)", () => {
  const formService = new FormService();
  const createdUserIds: string[] = [];
  const createdFormIds: string[] = [];

  afterEach(async () => {
    for (const formId of createdFormIds.splice(0)) {
      await cleanupForm(formId);
    }
    for (const userId of createdUserIds.splice(0)) {
      await cleanupUser(userId);
    }
  });

  it("blocks creating a 6th dossier on the free tier (max 5)", async () => {
    const { id: userId } = await createTestUser("billing-free");
    createdUserIds.push(userId);

    for (let i = 0; i < 5; i++) {
      const form = await formService.create(userId, { title: `Dossier ${i + 1}` });
      createdFormIds.push(form.id);
    }

    await assert.rejects(
      () => formService.create(userId, { title: "Dossier 6" }),
      (error: unknown) => {
        assert.ok(error instanceof PlanLimitError);
        assert.equal(error.reason, "form_limit");
        assert.equal(error.plan, "free");
        return true;
      },
    );
  });
});
