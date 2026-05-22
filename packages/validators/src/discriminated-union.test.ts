import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formFieldSchema } from "@repo/types";

import { fieldAnswerPayloadSchema, emailFieldAnswerSchema } from "./field-answer-schemas";

describe("discriminated union schemas", () => {
  it("formFieldSchema discriminates by type", () => {
    const parsed = formFieldSchema.parse({
      id: "f1",
      type: "email",
      required: true,
      sortOrder: 0,
    });
    assert.equal(parsed.type, "email");

    assert.throws(() =>
      formFieldSchema.parse({
        id: "f1",
        type: "not_a_field_type",
        required: true,
        sortOrder: 0,
      }),
    );
  });

  it("fieldAnswerPayloadSchema discriminates by type", () => {
    assert.doesNotThrow(() =>
      fieldAnswerPayloadSchema.parse({
        type: "email",
        value: "user@example.com",
      }),
    );

    assert.throws(() =>
      fieldAnswerPayloadSchema.parse({
        type: "email",
        value: "not-an-email",
      }),
    );

    assert.throws(() =>
      fieldAnswerPayloadSchema.parse({
        type: "checkbox",
        value: "yes",
      }),
    );
  });

  it("fieldAnswerPayloadSchema has one branch per field type", () => {
    assert.equal(fieldAnswerPayloadSchema.options.length, 9);
    assert.equal(emailFieldAnswerSchema.shape.type.value, "email");
  });
});
