import type { FormFieldType } from "@repo/types";

export type FieldTypeMeta = {
  type: FormFieldType;
  label: string;
  description: string;
  defaultLabel: string;
};

export const FIELD_TYPE_CATALOG: FieldTypeMeta[] = [
  {
    type: "short_text",
    label: "SHORT TEXT",
    description: "Single-line operative report",
    defaultLabel: "Subject line",
  },
  {
    type: "long_text",
    label: "LONG TEXT",
    description: "Extended field notes",
    defaultLabel: "Field notes",
  },
  {
    type: "email",
    label: "EMAIL",
    description: "Email address; auto-filled when signed in",
    defaultLabel: "Email address",
  },
  {
    type: "number",
    label: "NUMERIC DATA",
    description: "Quantified intelligence",
    defaultLabel: "Numeric value",
  },
  {
    type: "single_select",
    label: "SINGLE SELECT",
    description: "One approved option",
    defaultLabel: "Classification",
  },
  {
    type: "multi_select",
    label: "MULTI SELECT",
    description: "Multiple approved options",
    defaultLabel: "Capabilities",
  },
  {
    type: "rating",
    label: "THREAT RATING",
    description: "Scale 1–5 assessment",
    defaultLabel: "Threat level",
  },
  {
    type: "date",
    label: "DATE STAMP",
    description: "Incident date record",
    defaultLabel: "Date of incident",
  },
  {
    type: "checkbox",
    label: "CONFIRMATION",
    description: "Yes / no directive",
    defaultLabel: "I confirm the above is accurate",
  },
];

export const DEFAULT_SELECT_OPTIONS = ["Option A", "Option B", "Option C"];

export function defaultValidationConfig(type: FormFieldType) {
  if (type === "single_select" || type === "multi_select") {
    return { options: [...DEFAULT_SELECT_OPTIONS] };
  }
  if (type === "rating") {
    return { max: 5 };
  }
  return null;
}
