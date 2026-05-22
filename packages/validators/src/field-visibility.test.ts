import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { FormField } from "@repo/types";

import { buildZodSchema } from "./form-schema-builder";
import { getVisibleFields, isFieldVisible } from "./field-visibility";

function field(overrides: Partial<FormField> & Pick<FormField, "id" | "type">): FormField {
  return {
    sortOrder: 0,
    required: true,
    validationConfig: null,
    visibilityConfig: null,
    ...overrides,
  } as FormField;
}

describe("field visibility", () => {
  const fields: FormField[] = [
    field({
      id: "a",
      type: "single_select",
      sortOrder: 0,
      validationConfig: { options: ["yes", "no"] },
    }),
    field({
      id: "b",
      type: "short_text",
      sortOrder: 1,
      visibilityConfig: {
        mode: "show_when",
        rules: [{ fieldId: "a", operator: "equals", value: "yes" }],
      },
    }),
  ];

  it("hides field when show_when rule does not match", () => {
    assert.equal(isFieldVisible(fields[1]!, fields, { a: "no" }), false);
    assert.equal(isFieldVisible(fields[1]!, fields, { a: "yes" }), true);
  });

  it("getVisibleFields excludes hidden fields", () => {
    const visible = getVisibleFields(fields, { a: "no" });
    assert.deepEqual(
      visible.map((f) => f.id),
      ["a"],
    );
  });

  it("buildZodSchema skips required hidden fields", () => {
    const schema = buildZodSchema(fields, { a: "no" });
    assert.deepEqual(schema.parse({ a: "no" }), { a: "no" });
    // Strict schema rejects answers for hidden fields (not in shape).
    assert.throws(() => schema.parse({ a: "no", b: "hello" }));
  });

  it("buildZodSchema validates visible conditional fields", () => {
    const schema = buildZodSchema(fields, { a: "yes" });
    assert.throws(() => schema.parse({ a: "yes" }));
    assert.deepEqual(schema.parse({ a: "yes", b: "ok" }), { a: "yes", b: "ok" });
  });
});
