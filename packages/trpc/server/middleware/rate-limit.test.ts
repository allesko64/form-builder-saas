import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRPCError } from "@trpc/server";

import { enforceSubmissionRateLimit } from "./rate-limit";

describe("enforceSubmissionRateLimit", () => {
  it("rejects when client key is missing", async () => {
    await assert.rejects(
      () => enforceSubmissionRateLimit(null, null, "form-id"),
      (err: TRPCError) => {
        assert.equal(err.code, "TOO_MANY_REQUESTS");
        return true;
      },
    );
  });

  it("allows up to five submissions per client per form in memory", async () => {
    const formId = `form-${Date.now()}`;
    const clientKey = `client-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      await enforceSubmissionRateLimit(null, clientKey, formId);
    }

    await assert.rejects(
      () => enforceSubmissionRateLimit(null, clientKey, formId),
      (err: TRPCError) => err.code === "TOO_MANY_REQUESTS",
    );
  });
});
