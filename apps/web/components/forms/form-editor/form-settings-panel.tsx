"use client";

import { useEffect, useState } from "react";

import { DossierInput, DossierLabel } from "~/components/auth/dossier-fields";
import { DossierToggle } from "~/components/dossier/toggle";
import {
  formToSettingsDraft,
  settingsDraftToPatch,
  type FormSettingsDraft,
} from "~/lib/form-editor/form-draft";
import type { EditorForm, FormPatch } from "~/lib/form-editor/optimistic-form-cache";

const textareaClass =
  "w-full min-h-[72px] resize-y rounded-none border border-dotted border-[var(--color-ink-faded)] bg-[color-mix(in_srgb,var(--color-paper-dark)_40%,transparent)] px-3 py-2 font-[family-name:var(--font-courier)] text-base text-[var(--color-ink)] focus:border-2 focus:border-solid focus:border-[var(--color-ink)] focus:outline-none";

type FormSettingsPanelProps = {
  form: EditorForm;
  syncRevision?: number;
  onQueuePatchAction: (patch: FormPatch) => void;
  onApplyNowAction: (patch: FormPatch) => void;
};

export function FormSettingsPanel({
  form,
  syncRevision = 0,
  onQueuePatchAction,
  onApplyNowAction,
}: FormSettingsPanelProps) {
  const [draft, setDraft] = useState<FormSettingsDraft>(() =>
    formToSettingsDraft(form),
  );

  useEffect(() => {
    setDraft(formToSettingsDraft(form));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form fields omitted during typing
  }, [form.id]);

  useEffect(() => {
    setDraft(formToSettingsDraft(form));
  }, [syncRevision, form]);

  function updateDraft(changed: keyof FormSettingsDraft, next: FormSettingsDraft) {
    setDraft(next);
    onQueuePatchAction(settingsDraftToPatch(next, changed));
  }

  return (
    <div className="space-y-5">
      <p className="dossier-kicker text-[var(--color-stamp)]">
        DOSSIER SETTINGS
      </p>

      <div>
        <DossierLabel>TITLE</DossierLabel>
        <DossierInput
          value={draft.title}
          onChange={(e) =>
            updateDraft("title", { ...draft, title: e.target.value })
          }
        />
      </div>

      <div>
        <DossierLabel>DESCRIPTION</DossierLabel>
        <textarea
          className={textareaClass}
          rows={3}
          value={draft.description}
          onChange={(e) =>
            updateDraft("description", { ...draft, description: e.target.value })
          }
        />
      </div>

      <div>
        <DossierLabel>SUBMIT BUTTON TEXT</DossierLabel>
        <DossierInput
          value={draft.submitButtonText}
          onChange={(e) =>
            updateDraft("submitButtonText", {
              ...draft,
              submitButtonText: e.target.value,
            })
          }
        />
      </div>

      <div>
        <DossierLabel>SUCCESS MESSAGE</DossierLabel>
        <textarea
          className={textareaClass}
          rows={3}
          value={draft.successMessage}
          placeholder="Transmission received. Thank you for your report."
          onChange={(e) =>
            updateDraft("successMessage", {
              ...draft,
              successMessage: e.target.value,
            })
          }
        />
      </div>

      <div>
        <DossierLabel>RESPONSE LIMIT (OPTIONAL)</DossierLabel>
        <DossierInput
          type="number"
          min={1}
          value={draft.responseLimit}
          onChange={(e) =>
            updateDraft("responseLimit", {
              ...draft,
              responseLimit: e.target.value,
            })
          }
        />
      </div>

      <div>
        <DossierLabel>EXPIRES AT (OPTIONAL)</DossierLabel>
        <DossierInput
          type="datetime-local"
          value={draft.expiresAtLocal}
          onChange={(e) =>
            updateDraft("expiresAtLocal", {
              ...draft,
              expiresAtLocal: e.target.value,
            })
          }
        />
      </div>

      <DossierToggle
        checked={draft.collectRespondentEmail}
        onChange={(checked) => {
          const next = { ...draft, collectRespondentEmail: checked };
          setDraft(next);
          onApplyNowAction(settingsDraftToPatch(next, "collectRespondentEmail"));
        }}
        label="SEND RESPONDENT CONFIRMATION EMAIL"
        offLabel="DISABLED"
        onLabel="ENABLED"
        description="When enabled, respondents receive a copy of their answers at the email address from an email field on this form. Requires Resend configured on the server."
      />
    </div>
  );
}
