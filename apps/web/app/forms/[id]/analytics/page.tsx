"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { DossierPageShell } from "~/components/dossier/page-shell";
import { Spinner } from "~/components/ui/spinner";
import { useAnalyticsLive } from "~/hooks/use-analytics-live";
import { trpc } from "~/trpc/client";

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatSampleDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const POLL_MS = 10_000;

export default function FormAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const live = useAnalyticsLive(formId);
  const usePolling = !live.isLive;

  const { data: form } = trpc.form.getById.useQuery(
    { id: formId },
    { enabled: !!formId },
  );

  const { data: overviewQuery, isPending: overviewPending } =
    trpc.analytics.overview.useQuery(
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

  const exportCsv = trpc.analytics.exportCsv.useQuery(
    { formId },
    { enabled: false },
  );

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
            <span className="dossier-meta text-[var(--color-ink-faded)]">
              COMPILING INTEL...
            </span>
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
                  <p className="dossier-meta text-[var(--color-ink-faded)]">
                    {label}
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-black tabular-nums text-[var(--color-ink)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {funnel && funnel.steps.length > 0 ? (
              <div className="mt-10 border-2 border-[var(--color-ink)] p-4 md:p-6">
                <p className="mb-1 dossier-kicker text-[var(--color-ink)]">
                  CONVERSION FUNNEL
                </p>
                <p className="mb-4 dossier-meta text-[var(--color-ink-faded)]">
                  Sessions tracked per step · {funnel.formStarts} opened ·{" "}
                  {funnel.submissions} submitted
                </p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={funnel.steps}
                      layout="vertical"
                      margin={{ left: 8, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-faded)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={140}
                        tick={{ fontSize: 10, fill: "var(--color-ink-faded)" }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "var(--font-courier)",
                          fontSize: 11,
                          border: "2px solid var(--color-ink)",
                        }}
                        formatter={(value, _name, item) => {
                          const payload = item.payload as {
                            retentionRate?: number;
                            stepDropoffRate?: number | null;
                          };
                          const retention = Math.round(
                            (payload.retentionRate ?? 0) * 100,
                          );
                          const drop =
                            payload.stepDropoffRate === null
                              ? "—"
                              : `${Math.round((payload.stepDropoffRate ?? 0) * 100)}%`;
                          return [
                            `${value} reached · ${retention}% of starts · ${drop} step dropoff`,
                            "Reached",
                          ];
                        }}
                      />
                      <Bar dataKey="reached" fill="var(--color-brass)" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-4 space-y-2 border-t border-dotted border-[var(--color-ink-faded)] pt-4">
                  {funnel.steps.map((step) => (
                    <li
                      key={`${step.stepIndex}-${step.label}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 dossier-meta"
                    >
                      <span className="text-[var(--color-ink)]">{step.label}</span>
                      <span className="tabular-nums text-[var(--color-ink-faded)]">
                        {step.reached} reached
                        {step.stepDropoffRate !== null
                          ? ` · ${Math.round(step.stepDropoffRate * 100)}% drop from prior`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {byDay && byDay.length > 0 ? (
              <div className="mt-10 border-2 border-[var(--color-ink)] p-4 md:p-6">
                <p className="mb-4 dossier-kicker text-[var(--color-ink)]">
                  RESPONSES OVER TIME
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-faded)" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: "var(--color-ink-faded)" }}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "var(--color-ink-faded)" }} />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "var(--font-courier)",
                          fontSize: 11,
                          border: "2px solid var(--color-ink)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-stamp)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {byField && byField.length > 0 ? (
              <div className="mt-10 space-y-8">
                <p className="dossier-kicker text-[var(--color-ink)]">
                  FIELD DISTRIBUTIONS
                </p>
                {byField.map((item) => {
                  const chartData = item.stats.optionCounts
                    ? Object.entries(item.stats.optionCounts).map(([name, count]) => ({
                        name,
                        count,
                      }))
                    : [];

                  const isTextLike =
                    item.type === "short_text" ||
                    item.type === "long_text" ||
                    item.type === "email" ||
                    item.type === "date";

                  const samples = item.stats.recentSamples ?? [];
                  const totalAnswers = item.stats.responseCount ?? samples.length;
                  const showingCount = samples.length;

                  return (
                    <div
                      key={item.fieldId}
                      className="border-2 border-[var(--color-ink-faded)] p-4"
                    >
                      <p className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--color-ink)]">
                        {item.label}
                      </p>
                      <p className="dossier-meta">
                        {item.type.replace(/_/g, " ")}
                        {item.stats.average !== undefined
                          ? ` · AVG ${item.stats.average.toFixed(1)}`
                          : isTextLike && totalAnswers > 0
                            ? ` · ${totalAnswers} RESPONSE${totalAnswers === 1 ? "" : "S"}`
                            : ""}
                      </p>

                      {chartData.length > 0 ? (
                        <div className="mt-4 h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-faded)" />
                              <XAxis type="number" tick={{ fontSize: 10 }} />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={100}
                                tick={{ fontSize: 10 }}
                              />
                              <Tooltip />
                              <Bar dataKey="count" fill="var(--color-ink)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : isTextLike ? (
                        <div className="mt-4 border border-dotted border-[var(--color-ink-faded)] bg-[var(--color-paper-dark)] p-4">
                          <p className="dossier-label text-[var(--color-ink-faded)]">
                            LATEST VERBATIM SAMPLES
                            {showingCount > 0
                              ? totalAnswers > showingCount
                                ? ` · NEWEST ${showingCount} OF ${totalAnswers}`
                                : ` · ${totalAnswers} ON FILE`
                              : ""}
                          </p>
                          {samples.length > 0 ? (
                            <ul className="mt-3 space-y-3">
                              {samples.map((s, i) => (
                                <li
                                  key={`${s.submittedAt}-${i}`}
                                  className="border-b border-dotted border-[var(--color-ink-faded)] pb-3 last:border-0 last:pb-0"
                                >
                                  <p className="dossier-caption text-[var(--color-ink-muted)]">
                                    FILED {formatSampleDate(s.submittedAt).toUpperCase()}
                                  </p>
                                  <p className="mt-1 font-[family-name:var(--font-courier)] text-sm leading-relaxed text-[var(--color-ink)]">
                                    {s.text}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 dossier-body text-sm text-[var(--color-ink-faded)]">
                              No answers recorded for this directive yet. Check that
                              responses were submitted after this field was added.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 dossier-body text-sm">
                          No distribution data yet.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </div>
    </DossierPageShell>
  );
}
