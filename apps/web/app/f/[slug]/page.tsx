import { PublicFormFiller } from "~/components/forms/public-form-filler";
import { DossierPageShell } from "~/components/dossier/page-shell";

const TICKER_ITEMS = [
  "PUBLIC TRANSMISSION TERMINAL — INCOMING FIELD REPORTS",
  "ALL SUBMISSIONS LOGGED AND TIME-STAMPED",
  "PROCEED WITH ACCURATE INTELLIGENCE ONLY",
];

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicFormPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <DossierPageShell tickerItems={TICKER_ITEMS}>
      <PublicFormFiller slug={slug} />
    </DossierPageShell>
  );
}
