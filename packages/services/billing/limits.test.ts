import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getPlanLimits, PLAN_DEFINITIONS } from "@repo/types";

describe("subscription plan limits", () => {
  it("free tier caps at 5 forms, 1 user, 1000 responses", () => {
    const limits = getPlanLimits("free");
    assert.equal(limits.maxForms, 5);
    assert.equal(limits.maxTeamUsers, 1);
    assert.equal(limits.maxResponsesPerMonth, 1_000);
  });

  it("senior handler tier caps at 25 / 3 / 10k", () => {
    const limits = getPlanLimits("senior_handler");
    assert.equal(limits.maxForms, 25);
    assert.equal(limits.maxTeamUsers, 3);
    assert.equal(limits.maxResponsesPerMonth, 10_000);
  });

  it("agency bureau tier caps at 100 / 10 / 25k", () => {
    const limits = getPlanLimits("agency_bureau");
    assert.equal(limits.maxForms, 100);
    assert.equal(limits.maxTeamUsers, 10);
    assert.equal(limits.maxResponsesPerMonth, 25_000);
  });

  it("exposes INR pricing on definitions", () => {
    assert.equal(PLAN_DEFINITIONS.senior_handler.pricing.monthly, 999);
    assert.equal(PLAN_DEFINITIONS.agency_bureau.pricing.monthly, 2_499);
  });
});
