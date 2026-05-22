import type { VisibilityConfig, VisibilityOperator } from "@repo/types";

import type { EditorField } from "./optimistic-form-cache";
import type { FieldPatch } from "./optimistic-form-cache";

export type FieldDraft = {
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  optionsText: string;
  maxRating: string;
  visibilityEnabled: boolean;
  visibilityMode: VisibilityConfig["mode"];
  visibilityFieldId: string;
  visibilityOperator: VisibilityOperator;
  visibilityValue: string;
};

export function fieldToDraft(field: EditorField): FieldDraft {
  const rule = field.visibilityConfig?.rules[0];
  return {
    label: field.label,
    placeholder: field.placeholder ?? "",
    helpText: field.helpText ?? "",
    required: field.required,
    optionsText: (field.validationConfig?.options ?? []).join("\n"),
    maxRating: String(field.validationConfig?.max ?? 5),
    visibilityEnabled: Boolean(field.visibilityConfig?.rules.length),
    visibilityMode: field.visibilityConfig?.mode ?? "show_when",
    visibilityFieldId: rule?.fieldId ?? "",
    visibilityOperator: rule?.operator ?? "equals",
    visibilityValue:
      rule?.value === undefined || rule.value === null
        ? ""
        : Array.isArray(rule.value)
          ? rule.value.join(", ")
          : String(rule.value),
  };
}

function buildVisibilityConfig(draft: FieldDraft): VisibilityConfig | null {
  if (!draft.visibilityEnabled || !draft.visibilityFieldId) {
    return null;
  }

  const rule: VisibilityConfig["rules"][number] = {
    fieldId: draft.visibilityFieldId,
    operator: draft.visibilityOperator,
  };

  if (draft.visibilityOperator === "equals" || draft.visibilityOperator === "not_equals") {
    const trimmed = draft.visibilityValue.trim();
    if (trimmed === "true" || trimmed === "false") {
      rule.value = trimmed === "true";
    } else if (trimmed.includes(",")) {
      rule.value = trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (trimmed.length > 0) {
      const asNumber = Number(trimmed);
      rule.value = Number.isFinite(asNumber) && trimmed !== "" ? asNumber : trimmed;
    }
  }

  return {
    mode: draft.visibilityMode,
    rules: [rule],
  };
}

export function draftToFieldPatch(
  field: EditorField,
  draft: FieldDraft,
  changed: keyof FieldDraft,
): FieldPatch {
  switch (changed) {
    case "label":
      return { label: draft.label };
    case "placeholder":
      return { placeholder: draft.placeholder || null };
    case "helpText":
      return { helpText: draft.helpText || null };
    case "required":
      return { required: draft.required };
    case "optionsText": {
      const opts = draft.optionsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        validationConfig: {
          ...(field.validationConfig ?? {}),
          options: opts,
        },
      };
    }
    case "maxRating":
      return {
        validationConfig: {
          ...(field.validationConfig ?? {}),
          max: Number(draft.maxRating) || 5,
        },
      };
    case "visibilityEnabled":
    case "visibilityMode":
    case "visibilityFieldId":
    case "visibilityOperator":
    case "visibilityValue":
      return { visibilityConfig: buildVisibilityConfig(draft) };
    default:
      return {};
  }
}
