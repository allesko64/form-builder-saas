"use client";

import Link from "next/link";

import { DossierStamp } from "~/components/dossier/stamp";
import { formatAnswer } from "~/lib/format-answer";
import { trpc } from "~/trpc/client";

type SubmissionReceiptViewProps = {
  slug: string;
  submissionId: string;
  /** Shown on the thank-you screen after submit (hides standalone page chrome). */
  embedded?: boolean;
};

export function SubmissionReceiptView({
  slug,
  submissionId,
  embedded = false,
}: SubmissionReceiptViewProps) {
  const { data, isPending, isError, error } = trpc.public.getSubmission.useQuery({
    slug,
    submissionId,
  });

  if (isPending) {
    return (
      <p className="py-16 text-center dossier-meta text-[var(--color-ink-faded)]">
        RETRIEVING FILED REPORT...
      </p>
    );
  }

  if (isError || !data) {
    const message =
      error?.data?.code === "NOT_FOUND"
        ? "This report was not found or is no longer available on this terminal."
        : error?.message ?? "Unable to load report.";
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <DossierStamp variant="red" rotate={-5} size="sm">
          NOT ON FILE
        </DossierStamp>
        <p className="mt-6 dossier-body">{message}</p>
        <Link
          href={`/f/${slug}`}
          className="dossier-nav mt-6 inline-block text-[var(--color-ink)] hover:text-[var(--color-stamp)]"
        >
          ← RETURN TO TERMINAL
        </Link>
      </div>
    );
  }

  const filed = new Date(data.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sortedFields = [...data.fields].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className={embedded ? "mx-auto max-w-xl" : "mx-auto max-w-xl px-6 py-10 md:px-8"}>
      {!embedded ? (
        <Link
          href={`/f/${slug}/my-reports`}
          className="dossier-nav text-[var(--color-ink-faded)] hover:text-[var(--color-ink)]"
        >
          ← MY FILED REPORTS
        </Link>
      ) : null}

      <div className={embedded ? "border-b-2 border-[var(--color-ink)] pb-6" : "mt-6 border-b-2 border-[var(--color-ink)] pb-6"}>
        <p className="dossier-kicker text-[var(--color-ink-faded)]">
          {embedded ? "YOUR FILED REPORT" : "TRANSMISSION RECEIPT"}
        </p>
        {!embedded ? (
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-black text-[var(--color-ink)]">
            {data.formTitle}
          </h1>
        ) : null}
        <p className={`dossier-meta text-[var(--color-ink-faded)] ${embedded ? "mt-2" : "mt-3"}`}>
          REPORT #{data.submissionId.slice(0, 8).toUpperCase()} · FILED {filed.toUpperCase()}
        </p>
      </div>

      <dl className="mt-8 space-y-5 border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-6">
        {sortedFields.map((field) => (
          <div key={field.id} className="border-b border-dashed border-[var(--color-ink-faded)] pb-4 last:border-0 last:pb-0">
            <dt className="dossier-label text-[var(--color-ink-faded)]">{field.label}</dt>
            <dd className="mt-2 font-[family-name:var(--font-lora)] text-sm text-[var(--color-ink)]">
              {formatAnswer(data.answers[field.id])}
            </dd>
          </div>
        ))}
      </dl>

      {data.completionTimeMs !== null ? (
        <p className="mt-4 dossier-caption text-[var(--color-ink-muted)]">
          Completion: {(data.completionTimeMs / 1000).toFixed(1)}s
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/f/${slug}`}
          className="dossier-btn block rounded-none border-2 border-[var(--color-ink)] px-5 py-3 text-center text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
        >
          FILE ANOTHER REPORT →
        </Link>
        <Link
          href={`/f/${slug}/my-reports`}
          className="dossier-btn block rounded-none border-2 border-[var(--color-ink-faded)] px-5 py-3 text-center text-[var(--color-ink-faded)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
        >
          ALL MY REPORTS
        </Link>
      </div>
    </div>
  );
}
