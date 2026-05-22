"use client";

import { useEffect, useState } from "react";

import { DossierInput, DossierLabel } from "~/components/auth/dossier-fields";
import {
  draftToFieldPatch,
  fieldToDraft,
  type FieldDraft,
} from "~/lib/form-editor/field-draft";
import type { EditorField, FieldPatch } from "~/lib/form-editor/optimistic-form-cache";

type FieldConfigPanelProps = {
  field: EditorField | null;
  allFields: EditorField[];
  syncRevision: number;
  onQueuePatchAction: (patch: FieldPatch) => void;
  onApplyNowAction: (patch: FieldPatch) => void;
};

const textareaClass =
  "w-full min-h-[72px] resize-y rounded-none border border-dotted border-[var(--color-ink-faded)] bg-[color-mix(in_srgb,var(--color-paper-dark)_40%,transparent)] px-3 py-2 font-[family-name:var(--font-courier)] text-base text-[var(--color-ink)] focus:border-2 focus:border-solid focus:border-[var(--color-ink)] focus:outline-none";

const selectClass =
  "w-full rounded-none border border-dotted border-[var(--color-ink-faded)] bg-[color-mix(in_srgb,var(--color-paper-dark)_40%,transparent)] px-3 py-2 font-[family-name:var(--font-courier)] text-sm text-[var(--color-ink)] focus:border-2 focus:border-solid focus:border-[var(--color-ink)] focus:outline-none";

export function FieldConfigPanel({
  field,
  allFields,
  syncRevision,
  onQueuePatchAction,
  onApplyNowAction,
}: FieldConfigPanelProps) {
  const [draft, setDraft] = useState<FieldDraft | null>(null);

  useEffect(() => {
    if (!field) {
      setDraft(null);
      return;
    }
    setDraft(fieldToDraft(field));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- field content intentionally omitted
  }, [field?.id]);

  useEffect(() => {
    if (field) setDraft(fieldToDraft(field));
  }, [syncRevision, field]);

  if (!field || !draft) {
    return (
      <p className="dossier-body">
        Select a directive from the canvas to edit its properties.
      </p>
    );
  }

  function updateDraft(changed: keyof FieldDraft, next: FieldDraft) {
    if (!field) return;
    setDraft(next);
    onQueuePatchAction(draftToFieldPatch(field, next, changed));
  }

  const hasOptions =
    field.type === "single_select" || field.type === "multi_select";

  const controllerCandidates = allFields
    .filter((f) => f.id !== field.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const showValueInput =
    draft.visibilityEnabled &&
    (draft.visibilityOperator === "equals" ||
      draft.visibilityOperator === "not_equals");

  return (
    <div className="space-y-4">
      <p className="dossier-kicker text-[var(--color-stamp)]">
        DIRECTIVE CONFIGURATION
      </p>

      <div>
        <DossierLabel>LABEL</DossierLabel>
        <DossierInput
          value={draft.label}
          onChange={(e) =>
            updateDraft("label", { ...draft, label: e.target.value })
          }
        />
      </div>

      <div>
        <DossierLabel>PLACEHOLDER</DossierLabel>
        <DossierInput
          value={draft.placeholder}
          onChange={(e) =>
            updateDraft("placeholder", { ...draft, placeholder: e.target.value })
          }
        />
      </div>

      <div>
        <DossierLabel>FIELD NOTES (HELP)</DossierLabel>
        <textarea
          className={textareaClass}
          value={draft.helpText}
          rows={2}
          onChange={(e) =>
            updateDraft("helpText", { ...draft, helpText: e.target.value })
          }
        />
      </div>

      <label className="flex items-center gap-2 font-[family-name:var(--font-courier)] text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[var(--color-ink)]">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-stamp)]"
          checked={draft.required}
          onChange={(e) => {
            const next = { ...draft, required: e.target.checked };
            setDraft(next);
            onApplyNowAction(draftToFieldPatch(field, next, "required"));
          }}
        />
        CLASSIFIED — MANDATORY
      </label>

      {hasOptions ? (
        <div>
          <DossierLabel>OPTIONS (ONE PER LINE)</DossierLabel>
          <textarea
            className={textareaClass}
            rows={5}
            value={draft.optionsText}
            onChange={(e) =>
              updateDraft("optionsText", { ...draft, optionsText: e.target.value })
            }
          />
        </div>
      ) : null}

      {field.type === "rating" ? (
        <div>
          <DossierLabel>MAX RATING</DossierLabel>
          <DossierInput
            type="number"
            min={1}
            max={10}
            value={draft.maxRating}
            onChange={(e) =>
              updateDraft("maxRating", { ...draft, maxRating: e.target.value })
            }
          />
        </div>
      ) : null}

      <div className="border-t border-dotted border-[var(--color-ink-faded)] pt-4">
        <p className="dossier-kicker mb-3 text-[var(--color-ink-faded)]">
          CONDITIONAL VISIBILITY
        </p>

        <label className="flex items-center gap-2 font-[family-name:var(--font-courier)] text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[var(--color-ink)]">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-stamp)]"
            checked={draft.visibilityEnabled}
            disabled={controllerCandidates.length === 0}
            onChange={(e) => {
              const next = { ...draft, visibilityEnabled: e.target.checked };
              setDraft(next);
              onApplyNowAction(draftToFieldPatch(field, next, "visibilityEnabled"));
            }}
          />
          SHOW / HIDE BASED ON ANOTHER DIRECTIVE
        </label>

        {controllerCandidates.length === 0 ? (
          <p className="mt-2 dossier-caption text-[var(--color-ink-faded)]">
            Add another directive first to use conditional visibility.
          </p>
        ) : null}

        {draft.visibilityEnabled && controllerCandidates.length > 0 ? (
          <div className="mt-4 space-y-3">
            <div>
              <DossierLabel>WHEN TO SHOW</DossierLabel>
              <select
                className={selectClass}
                value={draft.visibilityMode}
                onChange={(e) => {
                  const next = {
                    ...draft,
                    visibilityMode: e.target.value as FieldDraft["visibilityMode"],
                  };
                  setDraft(next);
                  onApplyNowAction(draftToFieldPatch(field, next, "visibilityMode"));
                }}
              >
                <option value="show_when">SHOW WHEN condition matches</option>
                <option value="hide_when">HIDE WHEN condition matches</option>
              </select>
            </div>

            <div>
              <DossierLabel>CONTROLLING DIRECTIVE</DossierLabel>
              <select
                className={selectClass}
                value={draft.visibilityFieldId}
                onChange={(e) => {
                  const next = { ...draft, visibilityFieldId: e.target.value };
                  setDraft(next);
                  onApplyNowAction(draftToFieldPatch(field, next, "visibilityFieldId"));
                }}
              >
                <option value="">Select directive…</option>
                {controllerCandidates.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <DossierLabel>CONDITION</DossierLabel>
              <select
                className={selectClass}
                value={draft.visibilityOperator}
                onChange={(e) => {
                  const next = {
                    ...draft,
                    visibilityOperator: e.target
                      .value as FieldDraft["visibilityOperator"],
                  };
                  setDraft(next);
                  onApplyNowAction(draftToFieldPatch(field, next, "visibilityOperator"));
                }}
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Does not equal</option>
                <option value="is_empty">Is empty</option>
                <option value="is_not_empty">Is not empty</option>
              </select>
            </div>

            {showValueInput ? (
              <div>
                <DossierLabel>VALUE</DossierLabel>
                <DossierInput
                  value={draft.visibilityValue}
                  placeholder="e.g. Yes, true, 42"
                  onChange={(e) =>
                    updateDraft("visibilityValue", {
                      ...draft,
                      visibilityValue: e.target.value,
                    })
                  }
                />
                <p className="mt-1 dossier-caption text-[var(--color-ink-faded)]">
                  For multi-select use comma-separated values.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
