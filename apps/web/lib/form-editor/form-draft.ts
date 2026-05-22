import type { EditorForm } from "./optimistic-form-cache";
import type { FormPatch } from "./optimistic-form-cache";

export type FormSettingsDraft = {
  title: string;
  description: string;
  submitButtonText: string;
  successMessage: string;
  responseLimit: string;
  expiresAtLocal: string;
  collectRespondentEmail: boolean;
};

export function formToSettingsDraft(form: EditorForm): FormSettingsDraft {
  return {
    title: form.title,
    description: form.description ?? "",
    submitButtonText: form.submitButtonText,
    successMessage: form.successMessage ?? "",
    responseLimit: form.responseLimit != null ? String(form.responseLimit) : "",
    expiresAtLocal: form.expiresAt
      ? new Date(form.expiresAt).toISOString().slice(0, 16)
      : "",
    collectRespondentEmail: form.collectRespondentEmail,
  };
}

export function settingsDraftToPatch(
  draft: FormSettingsDraft,
  changed: keyof FormSettingsDraft,
): FormPatch {
  switch (changed) {
    case "title":
      return { title: draft.title };
    case "description":
      return { description: draft.description || null };
    case "submitButtonText":
      return { submitButtonText: draft.submitButtonText };
    case "successMessage":
      return { successMessage: draft.successMessage || null };
    case "responseLimit": {
      const v = draft.responseLimit.trim();
      return { responseLimit: v === "" ? null : Number(v) };
    }
    case "expiresAtLocal":
      return {
        expiresAt: draft.expiresAtLocal
          ? new Date(draft.expiresAtLocal)
          : null,
      };
    case "collectRespondentEmail":
      return { collectRespondentEmail: draft.collectRespondentEmail };
    default:
      return {};
  }
}
