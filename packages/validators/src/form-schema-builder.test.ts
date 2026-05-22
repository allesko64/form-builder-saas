import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildZodSchema } from "./form-schema-builder";
import type { FormField } from "@repo/types";

function field(overrides: Partial<FormField> & Pick<FormField, "id" | "type">): FormField {
  return {
    sortOrder: 0,
    required: true,
    validationConfig: null,
    visibilityConfig: null,
    ...overrides,
  } as FormField;
}

describe("buildZodSchema", () => {
  it("rejects non-email strings for required email fields", () => {
    const schema = buildZodSchema([field({ id: "email-1", type: "email", required: true })]);

    assert.throws(() => schema.parse({ "email-1": "not-an-email" }));
    assert.deepEqual(schema.parse({ "email-1": "user@example.com" }), {
      "email-1": "user@example.com",
    });
  });

  it("accepts undefined for optional fields", () => {
    const schema = buildZodSchema([field({ id: "opt-1", type: "short_text", required: false })]);

    assert.deepEqual(schema.parse({}), {});
    assert.deepEqual(schema.parse({ "opt-1": undefined }), { "opt-1": undefined });
  });

  it("rejects select values not in options", () => {
    const schema = buildZodSchema([
      field({
        id: "choice-1",
        type: "single_select",
        validationConfig: { options: ["a", "b"] },
      }),
    ]);

    assert.throws(() => schema.parse({ "choice-1": "c" }));
    assert.deepEqual(schema.parse({ "choice-1": "a" }), { "choice-1": "a" });
  });

  it("rejects numbers below configured min", () => {
    const schema = buildZodSchema([
      field({
        id: "num-1",
        type: "number",
        validationConfig: { min: 5 },
      }),
    ]);

    assert.throws(() => schema.parse({ "num-1": 4 }));
    assert.deepEqual(schema.parse({ "num-1": 5 }), { "num-1": 5 });
  });

  it("rejects unknown answer keys (strict object)", () => {
    const schema = buildZodSchema([field({ id: "a", type: "short_text", required: true })]);

    assert.throws(() => schema.parse({ a: "ok", "foreign-field": "x" }));
  });

  it("builds a fresh schema on each call (not cached globally)", () => {
    const fieldsA: FormField[] = [field({ id: "a", type: "short_text", sortOrder: 0 })];
    const fieldsB: FormField[] = [field({ id: "b", type: "email", sortOrder: 0 })];

    const schemaA = buildZodSchema(fieldsA);
    const schemaB = buildZodSchema(fieldsB);

    assert.deepEqual(schemaA.parse({ a: "hello" }), { a: "hello" });
    assert.throws(() => schemaA.parse({ b: "user@example.com" }));
    assert.deepEqual(schemaB.parse({ b: "user@example.com" }), {
      b: "user@example.com",
    });
  });
});
