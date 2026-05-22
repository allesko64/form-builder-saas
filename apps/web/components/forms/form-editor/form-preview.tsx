"use client";

import { useSession } from "@repo/auth/client";
import type { RouterOutputs } from "@repo/trpc/client";
import { getVisibleFields } from "@repo/validators";

import { FormFieldRenderer } from "~/components/forms/form-field-renderer";
import { DossierStamp } from "~/components/dossier/stamp";
import { usePrefillEmailFields } from "~/hooks/use-prefill-email-fields";

type Form = RouterOutputs["form"]["getById"];

type FormPreviewProps = {
  form: Form;
  previewValues: Record<string, unknown>;
  setPreviewValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
};

export function FormPreview({ form, previewValues, setPreviewValues }: FormPreviewProps) {
  const { data: session } = useSession();
  const visible = getVisibleFields(form.fields, previewValues);

  const { showAutofillHint } = usePrefillEmailFields(
    form.id,
    form.fields,
    session?.user?.email,
    setPreviewValues,
  );

  return (
    <div className="border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="dossier-kicker text-[var(--color-ink-faded)]">
            LIVE PREVIEW — NOT FOR TRANSMISSION
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-black text-[var(--color-ink)]">
            {form.title}
          </h2>
          {form.description ? <p className="mt-2 dossier-body">{form.description}</p> : null}
        </div>
        <DossierStamp variant="brass" rotate={3} size="xs">
          PREVIEW
        </DossierStamp>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center font-[family-name:var(--font-lora)] text-[var(--color-ink-faded)]">
          Add directives to preview the operative terminal.
        </p>
      ) : (
        <div className="space-y-6">
          {visible.map((field) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={previewValues[field.id]}
              onChange={(v) => setPreviewValues((prev) => ({ ...prev, [field.id]: v }))}
              emailAutofillHint={field.type === "email" && showAutofillHint}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        disabled
        className="dossier-btn mt-8 w-full border-2 border-[var(--color-ink)] bg-[var(--color-ink)] py-3 text-[var(--color-paper)] opacity-80"
      >
        {form.submitButtonText || "SUBMIT REPORT"}
      </button>
    </div>
  );
}
