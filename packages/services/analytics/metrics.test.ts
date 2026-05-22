import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeDropoffMetrics } from "./metrics";

describe("computeDropoffMetrics", () => {
  it("returns zero rates when there are no starts", () => {
    const result = computeDropoffMetrics(0, 0);
    assert.equal(result.dropoffRate, 0);
    assert.equal(result.submissionRate, 0);
    assert.equal(result.abandoned, 0);
  });

  it("computes dropoff when starts exceed submissions", () => {
    const result = computeDropoffMetrics(10, 4);
    assert.equal(result.formStarts, 10);
    assert.equal(result.abandoned, 6);
    assert.equal(result.dropoffRate, 0.6);
    assert.equal(result.submissionRate, 0.4);
  });

  it("uses submissions as effective starts when sessions are missing", () => {
    const result = computeDropoffMetrics(2, 8);
    assert.equal(result.formStarts, 8);
    assert.equal(result.dropoffRate, 0);
    assert.equal(result.submissionRate, 1);
  });
});
