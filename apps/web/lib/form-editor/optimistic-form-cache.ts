import type { VisibilityConfig } from "@repo/types";
import type { RouterOutputs } from "@repo/trpc/client";

export type EditorForm = RouterOutputs["form"]["getById"];
export type EditorField = EditorForm["fields"][number];

export type FieldPatch = {
  label?: string;
  placeholder?: string | null;
  helpText?: string | null;
  required?: boolean;
  validationConfig?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  } | null;
  visibilityConfig?: VisibilityConfig | null;
};

export type FormPatch = {
  title?: string;
  description?: string | null;
  theme?: Record<string, unknown> | null;
  submitButtonText?: string;
  successMessage?: string | null;
  responseLimit?: number | null;
  expiresAt?: Date | null;
  collectRespondentEmail?: boolean;
};

function mergeValidationConfig(
  current: EditorField["validationConfig"],
  patch: FieldPatch["validationConfig"],
): EditorField["validationConfig"] {
  if (patch === undefined) return current;
  if (patch === null) return null;
  return { ...(current ?? {}), ...patch };
}

export function mergeField(field: EditorField, patch: FieldPatch): EditorField {
  return {
    ...field,
    ...(patch.label !== undefined ? { label: patch.label } : {}),
    ...(patch.placeholder !== undefined ? { placeholder: patch.placeholder } : {}),
    ...(patch.helpText !== undefined ? { helpText: patch.helpText } : {}),
    ...(patch.required !== undefined ? { required: patch.required } : {}),
    ...(patch.validationConfig !== undefined
      ? { validationConfig: mergeValidationConfig(field.validationConfig, patch.validationConfig) }
      : {}),
    ...(patch.visibilityConfig !== undefined ? { visibilityConfig: patch.visibilityConfig } : {}),
  };
}

export function patchFormFields(form: EditorForm, fieldId: string, patch: FieldPatch): EditorForm {
  return {
    ...form,
    fields: form.fields.map((f) => (f.id === fieldId ? mergeField(f, patch) : f)),
  };
}

export function patchFormData(form: EditorForm, patch: FormPatch): EditorForm {
  const { expiresAt, ...rest } = patch;
  const next: EditorForm = { ...form, ...rest };
  if (expiresAt !== undefined) {
    next.expiresAt =
      expiresAt instanceof Date ? (expiresAt.toISOString() as EditorForm["expiresAt"]) : expiresAt;
  }
  return next;
}
