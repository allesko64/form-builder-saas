"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DossierPageShell } from "~/components/dossier/page-shell";
import { Spinner } from "~/components/ui/spinner";
import { trpc } from "~/trpc/client";
import { formatAnswer } from "~/lib/format-answer";
import { cn } from "~/lib/utils";

export default function FormResponsesPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data: form } = trpc.form.getById.useQuery({ id: formId }, { enabled: !!formId });

  const { data, isPending, isFetching } = trpc.analytics.responses.useQuery({
    formId,
    limit: 20,
    cursor,
    fromDate: fromDate ? new Date(fromDate) : undefined,
  });

  const [items, setItems] = useState<NonNullable<typeof data>["items"]>([]);

  useEffect(() => {
    if (!data) return;
    if (!cursor) {
      setItems(data.items);
    } else {
      setItems((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        const merged = [...prev];
        for (const row of data.items) {
          if (!ids.has(row.id)) merged.push(row);
        }
        return merged;
      });
    }
  }, [data, cursor]);

  return (
    <DossierPageShell classification="EYES ONLY">
      <div className="px-6 py-8 md:px-10">
        <Link
          href={`/forms/${formId}/analytics`}
          className="dossier-nav text-[var(--color-ink-faded)] hover:text-[var(--color-ink)]"
        >
          ← FIELD ANALYTICS
        </Link>

        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl font-black text-[var(--color-ink)]">
          {form?.title ?? "Response Log"}
        </h1>
        <p className="mt-1 dossier-meta text-[var(--color-ink-faded)]">INCOMING FIELD REPORTS</p>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block dossier-label text-[var(--color-ink-faded)]">
              FROM DATE
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCursor(undefined);
              }}
              className="border border-dotted border-[var(--color-ink-faded)] bg-[var(--color-paper-dark)] px-3 py-2 font-[family-name:var(--font-courier)] text-sm"
            />
          </div>
        </div>

        {isPending ? (
          <div className="mt-12 flex items-center gap-3">
            <Spinner className="size-5" />
            <span className="dossier-meta text-[var(--color-ink-faded)]">
              RETRIEVING REPORTS...
            </span>
          </div>
        ) : items.length === 0 ? (
          <p className="mt-12 dossier-body">No field reports on record for this dossier.</p>
        ) : (
          <div className="mt-8 divide-y-2 divide-[var(--color-ink)] border-2 border-[var(--color-ink)]">
            {items.map((row) => {
              const expanded = expandedId === row.id;
              const filed = new Date(row.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={row.id} className="bg-[var(--color-paper)]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[var(--color-paper-dark)]"
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                  >
                    <div>
                      <p className="dossier-meta text-[var(--color-ink-faded)]">
                        FILED {filed.toUpperCase()}
                      </p>
                      <p className="mt-1 font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--color-ink)]">
                        Report #{row.submissionId.slice(0, 8).toUpperCase()}
                      </p>
                      {row.respondentEmail ? (
                        <p className="mt-1 font-[family-name:var(--font-lora)] text-xs text-[var(--color-ink-muted)]">
                          {row.respondentEmail}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "dossier-label",
                        expanded ? "text-[var(--color-stamp)]" : "text-[var(--color-ink-faded)]",
                      )}
                    >
                      {expanded ? "COLLAPSE ↑" : "EXPAND ↓"}
                    </span>
                  </button>

                  {expanded ? (
                    <div className="border-t border-dashed border-[var(--color-ink-faded)] px-6 py-4">
                      <dl className="space-y-3">
                        {Object.entries(row.answers).map(([fieldId, value]) => {
                          const field = form?.fields.find((f) => f.id === fieldId);
                          return (
                            <div key={fieldId}>
                              <dt className="dossier-label text-[var(--color-ink-faded)]">
                                {field?.label ?? fieldId.slice(0, 8)}
                              </dt>
                              <dd className="mt-1 font-[family-name:var(--font-lora)] text-sm text-[var(--color-ink)]">
                                {formatAnswer(value)}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                      {row.completionTimeMs !== null ? (
                        <p className="mt-4 dossier-caption text-[var(--color-ink-muted)]">
                          Completion: {(row.completionTimeMs / 1000).toFixed(1)}s
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {data?.nextCursor ? (
          <button
            type="button"
            disabled={isFetching}
            onClick={() => setCursor(data.nextCursor ?? undefined)}
            className="mt-6 border-2 border-[var(--color-ink)] px-6 py-2 dossier-nav text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] disabled:opacity-50"
          >
            {isFetching ? "LOADING..." : "LOAD MORE REPORTS"}
          </button>
        ) : null}
      </div>
    </DossierPageShell>
  );
}
