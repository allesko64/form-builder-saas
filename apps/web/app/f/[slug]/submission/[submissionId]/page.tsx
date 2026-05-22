import { SubmissionReceiptView } from "~/components/forms/submission-receipt-view";
import { DossierPageShell } from "~/components/dossier/page-shell";

const TICKER_ITEMS = [
  "TRANSMISSION RECEIPT — VERIFIED FIELD REPORT ON FILE",
  "OPERATIVE MAY REVIEW FILED INTELLIGENCE AT ANY TIME",
  "REPORT ACCESS LIMITED TO RECEIPT HOLDER",
];

type PageProps = {
  params: Promise<{ slug: string; submissionId: string }>;
};

export default async function SubmissionReceiptPage({ params }: PageProps) {
  const { slug, submissionId } = await params;

  return (
    <DossierPageShell tickerItems={TICKER_ITEMS}>
      <SubmissionReceiptView slug={slug} submissionId={submissionId} />
    </DossierPageShell>
  );
}
