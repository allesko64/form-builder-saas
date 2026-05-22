import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanupForm, cleanupUser, createTestUser } from "./helpers/fixtures.js";
import { formService } from "./helpers/services.js";

function isPlanLimitError(error: unknown): error is Error & { reason: string; plan: string } {
  return (
    error instanceof Error &&
    error.name === "PlanLimitError" &&
    typeof (error as { reason?: unknown }).reason === "string" &&
    typeof (error as { plan?: unknown }).plan === "string"
  );
}

describe("billing plan limits (integration)", () => {
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
        assert.ok(isPlanLimitError(error));
        assert.equal(error.reason, "form_limit");
        assert.equal(error.plan, "free");
        return true;
      },
    );
  });
});
