"use client";

/**
 * SubmitSuccessScreen — the submit ceremony + newspaper front-page layout.
 *
 * Sequence of events on mount:
 *  0.00s  "CASE CLOSED" stamp slams down   (DossierStamp entrance animation)
 *  0.55s  Wax seal drops with spring bounce (motion.div delay)
 *  1.20s  Text lines reveal one by one      (staggerChildren on containerVariants)
 *
 * The 3-column newspaper grid mirrors THEME.md §5.5 — left column carries
 * the stamp/seal/lead article, center holds verbatim responses, right holds
 * case metadata and navigation links.
 */

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import type { RouterOutputs } from "@repo/trpc/client";
import { DossierStamp } from "~/components/dossier/stamp";

type PublicForm = RouterOutputs["public"]["getForm"];

type SubmitSuccessScreenProps = {
  form: PublicForm;
  answers: Record<string, unknown>;
  slug: string;
  submissionId: string;
  /** Whether the respondent opted in and an email will be dispatched. */
  emailSent?: boolean;
};

// Each staggered line fades up into place — typewriter-report feel
const lineVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  },
};

// Parent container: delays children until after stamp + seal animation
const staggerContainer = (delayChildren = 1.2) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.3, delayChildren } },
});

function formatAnswer(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "CONFIRMED" : "DENIED";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function SubmitSuccessScreen({
  form,
  answers,
  slug,
  submissionId,
  emailSent = false,
}: SubmitSuccessScreenProps) {
  const sorted = [...form.fields].sort((a, b) => a.sortOrder - b.sortOrder);

  const today = new Date()
    .toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();

  const timeStr = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const caseRef = `CASE-${slug.toUpperCase()}-${submissionId.slice(0, 8).toUpperCase()}`;

  const answeredFields = sorted.filter((f) => {
    const v = answers[f.id];
    return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">

      {/* ── Broadsheet masthead ──────────────────────────────────── */}
      <div className="border-y-4 border-[var(--color-ink)] py-3 text-center">
        <p className="dossier-meta text-[var(--color-ink-faded)]">
          {today} · {caseRef} · CLASSIFICATION: RESTRICTED
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-black text-[var(--color-ink)] md:text-4xl">
          INTELLIGENCE DOSSIER — FILED & ACCEPTED
        </h1>
        <p className="dossier-kicker mt-1 text-[var(--color-ink-faded)]">{form.title}</p>
      </div>

      {/* ── 3-column newspaper grid ──────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-0">

        {/* ── Column 1: Stamp · Seal · Lead article ──────────────── */}
        <div className="md:border-r-2 md:border-[var(--color-ink)] md:pr-6">

          {/* CASE CLOSED stamp — slams on mount via DossierStamp's built-in entrance */}
          <div className="mb-6 flex justify-center">
            <DossierStamp variant="red" rotate={-7} size="lg">
              CASE CLOSED
            </DossierStamp>
          </div>

          {/* Wax seal — spring bounce after stamp settles */}
          <motion.svg
            viewBox="0 0 120 120"
            className="mx-auto mb-6 h-24 w-24 drop-shadow-lg"
            initial={{ scale: 0, rotate: -50, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 13,
              delay: 0.55,
            }}
            aria-label="Official wax seal"
          >
            {/* Drop shadow layer */}
            <circle cx="62" cy="63" r="46" fill="rgba(0,0,0,0.25)" />
            {/* Main brass body */}
            <circle cx="60" cy="60" r="46" fill="var(--color-brass)" />
            {/* Outer decorative ring */}
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="var(--color-manila)"
              strokeWidth="1.5"
            />
            {/* Inner ring */}
            <circle
              cx="60"
              cy="60"
              r="34"
              fill="none"
              stroke="var(--color-manila)"
              strokeWidth="1"
            />
            {/* 8 radial tick marks between rings */}
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={60 + 36 * Math.cos(a)}
                  y1={60 + 36 * Math.sin(a)}
                  x2={60 + 42 * Math.cos(a)}
                  y2={60 + 42 * Math.sin(a)}
                  stroke="var(--color-manila)"
                  strokeWidth="1.5"
                />
              );
            })}
            {/* Seal text */}
            <text
              x="60"
              y="50"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="7.5"
              fontWeight="bold"
              fill="var(--color-paper)"
              letterSpacing="2"
            >
              THE
            </text>
            <text
              x="60"
              y="62"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="7.5"
              fontWeight="bold"
              fill="var(--color-paper)"
              letterSpacing="0.5"
            >
              DOSSIER
            </text>
            <text
              x="60"
              y="74"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="7.5"
              fontWeight="bold"
              fill="var(--color-paper)"
              letterSpacing="2"
            >
              TIMES
            </text>
          </motion.svg>

          {/* Lead article — typewriter reveal */}
          <motion.div
            variants={staggerContainer(1.1)}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.p className="dossier-body text-sm leading-relaxed" variants={lineVariants}>
              {form.successMessage ??
                "Your intelligence has been logged. Handler review is pending clearance."}
            </motion.p>
            <motion.p
              className="dossier-body text-sm leading-relaxed text-[var(--color-ink-faded)]"
              variants={lineVariants}
            >
              All submitted data is secured under Protocol Delta-7. Retain your case reference
              number for future inquiries.
            </motion.p>
            <motion.div
              className="border border-dotted border-[var(--color-ink-faded)] p-3"
              variants={lineVariants}
            >
              <p className="dossier-label mb-1 text-[var(--color-ink-faded)]">FILE REFERENCE</p>
              <p className="break-all font-[family-name:var(--font-courier)] text-xs text-[var(--color-ink)]">
                {caseRef}
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Column 2: Verbatim responses ───────────────────────── */}
        <div className="md:border-r-2 md:border-[var(--color-ink)] md:px-6">
          <h2 className="dossier-section-title mb-5 border-b-2 border-[var(--color-ink)] pb-2">
            SUBJECT RESPONSES — VERBATIM TRANSCRIPT
          </h2>

          {answeredFields.length === 0 ? (
            <p className="dossier-body text-sm text-[var(--color-ink-faded)]">
              No responses recorded.
            </p>
          ) : (
            <motion.div
              className="space-y-5"
              variants={staggerContainer(1.3)}
              initial="hidden"
              animate="visible"
            >
              {answeredFields.map((field) => (
                <motion.div
                  key={field.id}
                  className="border-b border-dotted border-[var(--color-ink-faded)] pb-4"
                  variants={lineVariants}
                >
                  <p className="dossier-label mb-1 text-[var(--color-ink-faded)]">
                    {field.label}
                    {field.required && (
                      <span className="ml-2 text-[var(--color-stamp)]">· MANDATORY</span>
                    )}
                  </p>
                  <p className="font-[family-name:var(--font-courier)] text-sm leading-relaxed text-[var(--color-ink)]">
                    {formatAnswer(answers[field.id])}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Column 3: Case metadata + navigation ───────────────── */}
        <div className="md:pl-6">
          <h2 className="dossier-section-title mb-5 border-b-2 border-[var(--color-ink)] pb-2">
            CASE FILE METADATA
          </h2>

          <motion.div
            className="space-y-4"
            variants={staggerContainer(1.5)}
            initial="hidden"
            animate="visible"
          >
            {[
              { label: "OPERATION", value: form.title },
              { label: "FILED ON", value: today },
              { label: "TIME LOGGED", value: `${timeStr} HRS` },
              { label: "CLASSIFICATION", value: "RESTRICTED" },
              {
                label: "DIRECTIVES COMPLETED",
                value: `${answeredFields.length} OF ${sorted.length}`,
              },
              ...(form.collectRespondentEmail
                ? [
                    {
                      label: "EMAIL CONFIRMATION",
                      value: emailSent ? "DISPATCHED TO OPERATIVE" : "NOT REQUESTED",
                    },
                  ]
                : []),
            ].map(({ label, value }) => (
              <motion.div
                key={label}
                className="border-b border-dotted border-[var(--color-ink-faded)] pb-3"
                variants={lineVariants}
              >
                <p className="dossier-label text-[var(--color-ink-faded)]">{label}</p>
                <p className="mt-0.5 font-[family-name:var(--font-courier)] text-xs text-[var(--color-ink)]">
                  {value}
                </p>
              </motion.div>
            ))}

            {/* Navigation actions */}
            <motion.div className="space-y-3 pt-2" variants={lineVariants}>
              <Link
                href={`/f/${slug}/submission/${submissionId}`}
                className="block border-2 border-[var(--color-ink)] px-4 py-2 text-center dossier-meta text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
              >
                VIEW MY SUBMISSION →
              </Link>
              <Link
                href={`/f/${slug}/my-reports`}
                className="block border border-dotted border-[var(--color-ink-faded)] px-4 py-2 text-center dossier-meta text-[var(--color-ink-faded)] transition-colors hover:text-[var(--color-ink)]"
              >
                ALL MY REPORTS
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Footer rule ──────────────────────────────────────────── */}
      <div className="mt-8 border-t-2 border-[var(--color-ink)] pt-4 text-center">
        <p className="dossier-caption text-[var(--color-ink-muted)]">
          DOSSIER TIMES SECURE TRANSMISSION · CLASSIFIED INTERNAL USE ONLY
        </p>
      </div>
    </div>
  );
}
