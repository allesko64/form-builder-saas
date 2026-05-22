"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DossierStamp } from "~/components/dossier/stamp";
import {
  getSubmissionReceipts,
  type SubmissionReceipt,
} from "~/lib/submission-receipts";

type MySubmissionsListProps = {
  slug: string;
  formTitle?: string;
};

export function MySubmissionsList({ slug, formTitle }: MySubmissionsListProps) {
  const [receipts, setReceipts] = useState<SubmissionReceipt[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReceipts(getSubmissionReceipts(slug));
    setReady(true);
  }, [slug]);

  if (!ready) {
    return (
      <p className="py-16 text-center dossier-meta text-[var(--color-ink-faded)]">
        LOADING YOUR FILED REPORTS...
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10 md:px-8">
      <Link
        href="/explore"
        className="dossier-nav text-[var(--color-ink-faded)] hover:text-[var(--color-ink)]"
      >
        ← RETURN TO INTELLIGENCE HQ
      </Link>

      <div className="mt-6 border-b-2 border-[var(--color-ink)] pb-6">
        <p className="dossier-kicker text-[var(--color-ink-faded)]">
          OPERATIVE RECORD
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-black text-[var(--color-ink)]">
          My filed reports
        </h1>
        {formTitle ? (
          <p className="mt-2 dossier-body">{formTitle}</p>
        ) : null}
        <p className="mt-3 dossier-meta text-[var(--color-ink-faded)]">
          Reports filed from this device on this terminal.
        </p>
      </div>

      {receipts.length === 0 ? (
        <div className="mt-12 text-center">
          <DossierStamp variant="brass" rotate={3} size="sm">
            NO RECORDS
          </DossierStamp>
          <p className="mt-6 dossier-body">
            You have not filed any reports on this terminal from this browser yet.
          </p>
          <Link
            href={`/f/${slug}`}
            className="dossier-btn mt-8 inline-block rounded-none border-2 border-[var(--color-ink)] px-5 py-3 text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
          >
            OPEN TERMINAL →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y-2 divide-[var(--color-ink)] border-2 border-[var(--color-ink)]">
          {receipts.map((receipt) => {
            const filed = new Date(receipt.submittedAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <li key={receipt.submissionId}>
                <Link
                  href={`/f/${slug}/submission/${receipt.submissionId}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[var(--color-paper-dark)]"
                >
                  <div>
                    <p className="dossier-meta text-[var(--color-ink-faded)]">
                      FILED {filed.toUpperCase()}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--color-ink)]">
                      Report #{receipt.submissionId.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <span className="dossier-label text-[var(--color-ink-faded)]">
                    VIEW →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
