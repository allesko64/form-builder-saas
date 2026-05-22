import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Request } from "express";

import {
  getClientIp,
  getTerminalIdFromRequest,
  hashIp,
  isPostgresUniqueViolation,
  resolveTerminalHash,
  TERMINAL_ID_HEADER,
} from "./ip";

function mockReq(
  headers: Record<string, string | string[] | undefined>,
  ip = "127.0.0.1",
): Request {
  return { headers, ip } as Request;
}

describe("terminal hash resolution", () => {
  it("prefers x-terminal-id header over IP", () => {
    const req = mockReq({
      [TERMINAL_ID_HEADER]: "device-abc-123",
      "x-forwarded-for": "203.0.113.1",
    });

    const withHeader = resolveTerminalHash(req, "salt");
    const withoutHeader = resolveTerminalHash(
      mockReq({ "x-forwarded-for": "203.0.113.1" }, "203.0.113.1"),
      "salt",
    );

    assert.ok(withHeader);
    assert.ok(withoutHeader);
    assert.notEqual(withHeader, withoutHeader);
  });

  it("hashes IP when terminal header is absent", () => {
    const req = mockReq({}, "10.0.0.5");
    const hash = resolveTerminalHash(req, "pepper");
    assert.equal(hash, hashIp("10.0.0.5", "pepper"));
  });

  it("reads first forwarded IP from x-forwarded-for", () => {
    const req = mockReq({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" });
    assert.equal(getClientIp(req), "198.51.100.1");
  });

  it("extracts terminal id from header", () => {
    const req = mockReq({ [TERMINAL_ID_HEADER]: "uuid-terminal" });
    assert.equal(getTerminalIdFromRequest(req), "uuid-terminal");
  });
});

describe("isPostgresUniqueViolation", () => {
  it("detects unique constraint errors", () => {
    assert.equal(
      isPostgresUniqueViolation(
        { code: "23505", constraint: "responses_form_id_ip_hash_unique_idx" },
        "responses_form_id_ip_hash_unique_idx",
      ),
      true,
    );
    assert.equal(
      isPostgresUniqueViolation(
        { code: "23505", constraint: "other" },
        "responses_form_id_ip_hash_unique_idx",
      ),
      false,
    );
    assert.equal(isPostgresUniqueViolation({ code: "23503" }), false);
  });
});
