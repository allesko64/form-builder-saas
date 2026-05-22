import type { FormField, FormFieldType, VisibilityConfig, VisibilityRule } from "@repo/types";

export type FieldWithVisibility = FormField;

function isEmptyAnswer(value: unknown, fieldType?: FormFieldType): boolean {
  if (value === undefined || value === null) return true;
  if (value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (fieldType === "checkbox" && value === false) return true;
  return false;
}

function normalizeForCompare(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify([...value].map(String).sort());
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return String(value ?? "");
}

function evaluateRule(
  rule: VisibilityRule,
  fieldsById: Map<string, FormField>,
  answers: Record<string, unknown>,
): boolean {
  const controller = fieldsById.get(rule.fieldId);
  const answer = answers[rule.fieldId];

  switch (rule.operator) {
    case "is_empty":
      return isEmptyAnswer(answer, controller?.type);
    case "is_not_empty":
      return !isEmptyAnswer(answer, controller?.type);
    case "equals":
      return normalizeForCompare(answer) === normalizeForCompare(rule.value);
    case "not_equals":
      return normalizeForCompare(answer) !== normalizeForCompare(rule.value);
    default:
      return false;
  }
}

/** Whether a field should be shown given current answers (all rules must match). */
export function isFieldVisible(
  field: FieldWithVisibility,
  allFields: FieldWithVisibility[],
  answers: Record<string, unknown>,
): boolean {
  const config = field.visibilityConfig;
  if (!config?.rules?.length) {
    return true;
  }

  const fieldsById = new Map(allFields.map((f) => [f.id, f]));
  const rulesMatch = config.rules.every((rule) => evaluateRule(rule, fieldsById, answers));

  return config.mode === "hide_when" ? !rulesMatch : rulesMatch;
}

/** Fields visible at the current step, in sort order. */
export function getVisibleFields<T extends FieldWithVisibility>(
  fields: T[],
  answers: Record<string, unknown>,
): T[] {
  const sorted = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.filter((field) => isFieldVisible(field, sorted, answers));
}

/** Drop answers for fields that are currently hidden. */
export function pruneHiddenAnswers<T extends FieldWithVisibility>(
  fields: T[],
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const visibleIds = new Set(getVisibleFields(fields, answers).map((f) => f.id));
  return Object.fromEntries(Object.entries(answers).filter(([fieldId]) => visibleIds.has(fieldId)));
}
