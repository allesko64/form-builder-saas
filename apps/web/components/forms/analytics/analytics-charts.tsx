"use client";

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

import type { RouterOutputs } from "@repo/trpc/client";

type FunnelData = RouterOutputs["analytics"]["funnel"];
type ByDayData = RouterOutputs["analytics"]["byDay"];
type ByFieldData = RouterOutputs["analytics"]["byField"];

function formatSampleDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type AnalyticsChartsProps = {
  funnel: FunnelData | undefined;
  byDay: ByDayData | undefined;
  byField: ByFieldData | undefined;
};

export function AnalyticsCharts({ funnel, byDay, byField }: AnalyticsChartsProps) {
  return (
    <>
      {funnel && funnel.steps.length > 0 ? (
        <div className="mt-10 border-2 border-[var(--color-ink)] p-4 md:p-6">
          <p className="mb-1 dossier-kicker text-[var(--color-ink)]">CONVERSION FUNNEL</p>
          <p className="mb-4 dossier-meta text-[var(--color-ink-faded)]">
            Sessions tracked per step · {funnel.formStarts} opened · {funnel.submissions} submitted
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel.steps} layout="vertical" margin={{ left: 8, right: 16 }}>
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
                    const retention = Math.round((payload.retentionRate ?? 0) * 100);
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
          <p className="mb-4 dossier-kicker text-[var(--color-ink)]">RESPONSES OVER TIME</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-faded)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-ink-faded)" }} />
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
          <p className="dossier-kicker text-[var(--color-ink)]">FIELD DISTRIBUTIONS</p>
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
              <div key={item.fieldId} className="border-2 border-[var(--color-ink-faded)] p-4">
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
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
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
                        No answers recorded for this directive yet. Check that responses were
                        submitted after this field was added.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 dossier-body text-sm">No distribution data yet.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
