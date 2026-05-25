"use client";

import Link from "next/link";
import { useSession } from "@repo/auth/client";

import { DossierPageShell } from "~/components/dossier/page-shell";
import { DossierStamp } from "~/components/dossier/stamp";
import { PLAN_DEFINITIONS, type SubscriptionPlan } from "@repo/types";
import { trpc } from "~/trpc/client";

const TICKER_ITEMS = [
  "CLEARANCE TIERS — OPERATIVE SUBSCRIPTION SCHEDULE",
  "LIMITS ENFORCED PER TIER — DOSSIERS · OPERATIVES · RESPONSES",
  "PRICES IN INR — BILLING GATEWAY COMING SOON",
];

const PLAN_ORDER: SubscriptionPlan[] = ["free", "senior_handler", "agency_bureau"];

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Field Operative",
  senior_handler: "Senior Handler",
  agency_bureau: "Agency Bureau",
};

function formatInr(amount: number): string {
  if (amount === 0) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function PricingPage() {
  const { data: session } = useSession();
  const { data: usage } = trpc.billing.usage.useQuery(undefined, {
    enabled: !!session?.user,
  });

  return (
    <DossierPageShell tickerItems={TICKER_ITEMS} classification="PRICING">
      <div className="px-6 py-10 md:px-10">
        <p className="dossier-kicker text-[var(--color-ink-faded)]">SUBSCRIPTION DIRECTIVE</p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-black text-[var(--color-ink)]">
          Clearance Tiers
        </h1>
        <p className="mt-3 max-w-2xl dossier-body text-sm text-[var(--color-ink-faded)]">
          Limits are enforced in the dossier system: active dossiers, team operatives, and monthly
          responses. Field Operative (free) allows up to 5 dossiers, 1 operative, and 1,000
          responses per month.
        </p>

        {usage ? (
          <div className="mt-6 border-2 border-dotted border-[var(--color-stamp)] bg-[color-mix(in_srgb,var(--color-paper-dark)_50%,transparent)] p-4">
            <p className="dossier-kicker text-[var(--color-stamp)]">YOUR CLEARANCE</p>
            <p className="mt-2 dossier-body text-sm">
              Current tier: <strong>{PLAN_LABELS[usage.plan]}</strong> — {usage.usage.activeForms} /{" "}
              {usage.limits.maxForms} dossiers,{" "}
              {usage.usage.responsesThisMonth.toLocaleString("en-IN")} /{" "}
              {usage.limits.maxResponsesPerMonth.toLocaleString("en-IN")} responses this month.
            </p>
            <Link
              href="/dashboard"
              className="mt-3 inline-block dossier-meta text-[var(--color-brass)] hover:text-[var(--color-stamp)]"
            >
              RETURN TO OVERVIEW →
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const plan = PLAN_DEFINITIONS[planId];
            const isFree = planId === "free";
            const isCurrent = usage?.plan === planId;

            return (
              <div
                key={planId}
                className="flex flex-col border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-6"
              >
                <DossierStamp variant={isCurrent ? "ink" : "brass"} rotate={-2} size="xs">
                  {isCurrent ? "ACTIVE CLEARANCE" : plan.stamp}
                </DossierStamp>
                <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-ink)]">
                  {plan.name}
                </h2>
                <p className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-black text-[var(--color-stamp)]">
                  {formatInr(plan.pricing.monthly)}
                  {!isFree ? (
                    <span className="ml-1 text-sm font-normal text-[var(--color-ink-faded)]">
                      / month
                    </span>
                  ) : null}
                </p>
                {!isFree ? (
                  <p className="mt-1 dossier-meta text-xs text-[var(--color-ink-faded)]">
                    or {formatInr(plan.pricing.yearlyPerMonth)}/mo billed yearly (
                    {formatInr(plan.pricing.yearlyTotal)}/yr)
                  </p>
                ) : null}
                <ul className="mt-6 flex-1 space-y-2 dossier-body text-sm">
                  {plan.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                {session?.user ? (
                  isCurrent ? (
                    <Link
                      href="/dashboard"
                      className="mt-6 block border-2 border-[var(--color-ink)] py-3 text-center dossier-nav text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
                    >
                      CURRENT TIER
                    </Link>
                  ) : (
                    <a
                      href={`mailto:contact@formbuilder.dev?subject=Upgrade request — ${plan.name}`}
                      className="mt-6 block border-2 border-[var(--color-ink)] py-3 text-center dossier-nav text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
                    >
                      REQUEST UPGRADE →
                    </a>
                  )
                ) : (
                  <Link
                    href="/sign-up"
                    className="mt-6 block border-2 border-[var(--color-ink)] py-3 text-center dossier-nav text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
                  >
                    BEGIN FILING
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 border-2 border-dotted border-[var(--color-ink-faded)] p-4">
          <p className="dossier-kicker text-[var(--color-stamp)]">LIMIT MATRIX</p>
          <table className="mt-3 w-full dossier-body text-sm">
            <thead>
              <tr className="border-b border-[var(--color-ink)] text-left">
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Dossiers</th>
                <th className="py-2 pr-4">Operatives</th>
                <th className="py-2">Responses / mo</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ORDER.map((planId) => {
                const { limits, name } = PLAN_DEFINITIONS[planId];
                return (
                  <tr key={planId} className="border-b border-[var(--color-ink-faded)]/40">
                    <td className="py-2 pr-4">{name}</td>
                    <td className="py-2 pr-4">{limits.maxForms}</td>
                    <td className="py-2 pr-4">{limits.maxTeamUsers}</td>
                    <td className="py-2">{limits.maxResponsesPerMonth.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DossierPageShell>
  );
}
