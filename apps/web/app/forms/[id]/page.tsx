"use client";

import { useParams } from "next/navigation";

import { FormEditor } from "~/components/forms/form-editor/form-editor";
import { DossierPageShell } from "~/components/dossier/page-shell";

const TICKER_ITEMS = [
  "DOCUMENT ARCHITECT — FIELD DIRECTIVES UNDER REVIEW",
  "CASE FILE EDITING AUTHORIZED FOR CLEARANCE HOLDERS",
  "PREVIEW AND PUBLICATION CHANNELS ACTIVE",
];

export default function FormEditorPage() {
  const params = useParams<{ id: string }>();

  return (
    <DossierPageShell tickerItems={TICKER_ITEMS} classification="EYES ONLY">
      <FormEditor formId={params.id} />
    </DossierPageShell>
  );
}
