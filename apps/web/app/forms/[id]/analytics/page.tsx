"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { DossierPageShell } from "~/components/dossier/page-shell";
import { Spinner } from "~/components/ui/spinner";
import { useAnalyticsLive } from "~/hooks/use-analytics-live";
import { trpc } from "~/trpc/client";

const AnalyticsCharts = dynamic(
  () =>
    import("~/components/forms/analytics/analytics-charts").then(
      (module) => module.AnalyticsCharts,
    ),
  {
    loading: () => (
      <div className="mt-10 flex items-center gap-3 border-2 border-dotted border-[var(--color-ink-faded)] p-6">
        <Spinner className="size-5" />
        <span className="dossier-meta text-[var(--color-ink-faded)]">LOADING CHART MODULES...</span>
      </div>
    ),
    ssr: false,
  },
);

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const POLL_MS = 10_000;

export default function FormAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const live = useAnalyticsLive(formId);
  const usePolling = !live.isLive;

  const { data: form } = trpc.form.getById.useQuery({ id: formId }, { enabled: !!formId });

  const { data: overviewQuery, isPending: overviewPending } = trpc.analytics.overview.useQuery(
    { formId },
    {
      enabled: !!formId,
      refetchInterval: usePolling ? POLL_MS : false,
    },
  );

  const { data: byDayQuery, isPending: byDayPending } = trpc.analytics.byDay.useQuery(
    { formId },
    {
      enabled: !!formId,
      refetchInterval: usePolling ? POLL_MS : false,
    },
  );

  const { data: byField, isPending: byFieldPending } = trpc.analytics.byField.useQuery(
    { formId },
    { enabled: !!formId, refetchInterval: usePolling ? POLL_MS : false },
  );

  const { data: funnel, isPending: funnelPending } = trpc.analytics.funnel.useQuery(
    { formId },
    { enabled: !!formId, refetchInterval: usePolling ? POLL_MS : false },
  );

  const overview = live.overview ?? overviewQuery;
  const byDay = live.byDay ?? byDayQuery;

  const exportCsv = trpc.analytics.exportCsv.useQuery({ formId }, { enabled: false });

  async function handleExport() {
    try {
      const result = await exportCsv.refetch();
      if (!result.data) {
        toast.error("Export failed");
        return;
      }
      const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Could not export CSV");
    }
  }

  const loading =
    (overviewPending && !live.overview) ||
    (byDayPending && !live.byDay) ||
    byFieldPending ||
    funnelPending;

  const liveLabel =
    live.status === "live"
      ? "LIVE"
      : live.status === "connecting" || live.status === "reconnecting"
        ? "SYNCING"
        : usePolling
          ? "POLLING"
          : null;

  return (
    <DossierPageShell classification="EYES ONLY">
      <div className="px-6 py-8 md:px-10">
        <Link
          href={`/forms/${formId}`}
          className="dossier-nav text-[var(--color-ink-faded)] hover:text-[var(--color-ink)]"
        >
          ← DOCUMENT ARCHITECT
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-black text-[var(--color-ink)] md:text-3xl">
            {form?.title ?? "Intelligence Report"}
          </h1>
          {liveLabel ? (
            <span
              className={`dossier-meta border px-2 py-0.5 ${
                live.status === "live"
                  ? "border-[var(--color-stamp)] text-[var(--color-stamp)]"
                  : "border-[var(--color-ink-faded)] text-[var(--color-ink-faded)]"
              }`}
            >
              {liveLabel}
              {live.status === "live" && live.activeViewers > 0
                ? ` · ${live.activeViewers} VIEWER${live.activeViewers === 1 ? "" : "S"}`
                : ""}
            </span>
          ) : null}
        </div>
        <p className="mt-1 dossier-meta text-[var(--color-ink-faded)]">
          FIELD ANALYTICS — CASE #{formId.slice(0, 8).toUpperCase()}
        </p>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/forms/${formId}/responses`}
            className="dossier-nav text-[var(--color-brass)] hover:text-[var(--color-stamp)]"
          >
            VIEW RESPONSES →
          </Link>
          <button
            type="button"
            onClick={handleExport}
            className="dossier-nav text-[var(--color-ink-faded)] hover:text-[var(--color-ink)]"
          >
            EXPORT CSV ↓
          </button>
        </div>

        {loading ? (
          <div className="mt-12 flex items-center gap-3">
            <Spinner className="size-5" />
            <span className="dossier-meta text-[var(--color-ink-faded)]">COMPILING INTEL...</span>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 border-2 border-[var(--color-ink)] sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "FORM STARTS",
                  value: String(overview?.formStarts ?? 0).padStart(4, "0"),
                },
                {
                  label: "SUBMISSIONS",
                  value: String(overview?.totalResponses ?? 0).padStart(4, "0"),
                },
                {
                  label: "DROPOFF RATE",
                  value: `${Math.round((overview?.dropoffRate ?? 0) * 100)}%`,
                },
                {
                  label: "SUBMISSION RATE",
                  value: `${Math.round((overview?.submissionRate ?? 0) * 100)}%`,
                },
                {
                  label: "AVG COMPLETION",
                  value: formatMs(overview?.avgCompletionMs ?? null),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="border-b-2 border-[var(--color-ink)] px-6 py-5 last:border-b-0 sm:border-b-0 lg:border-r-2 lg:last:border-r-0"
                >
                  <p className="dossier-meta text-[var(--color-ink-faded)]">{label}</p>
                  <p className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-black tabular-nums text-[var(--color-ink)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <AnalyticsCharts funnel={funnel} byDay={byDay} byField={byField} />
          </>
        )}
      </div>
    </DossierPageShell>
  );
}
