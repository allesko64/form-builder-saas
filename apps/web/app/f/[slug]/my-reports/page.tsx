"use client";

import { useParams } from "next/navigation";

import { MySubmissionsList } from "~/components/forms/my-submissions-list";
import { DossierPageShell } from "~/components/dossier/page-shell";
import { trpc } from "~/trpc/client";

const TICKER_ITEMS = [
  "OPERATIVE RECORD — FILED REPORTS ON THIS TERMINAL",
  "SELECT A REPORT TO REVIEW TRANSMITTED INTELLIGENCE",
  "CLEARANCE: RESPONDENT · DEVICE-LOCAL INDEX ONLY",
];

export default function MyReportsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: form } = trpc.public.getForm.useQuery({ slug }, { enabled: !!slug });

  if (!slug) {
    return null;
  }

  return (
    <DossierPageShell tickerItems={TICKER_ITEMS}>
      <MySubmissionsList slug={slug} formTitle={form?.title} />
    </DossierPageShell>
  );
}
