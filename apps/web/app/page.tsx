"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { ClassifiedWatermark } from "~/components/dossier/classified-watermark";
import { DossierStamp } from "~/components/dossier/stamp";
import { DossierPageShell } from "~/components/dossier/page-shell";

const TICKER_ITEMS = [
  "CLASSIFIED FORM BUILDER NOW OPERATIONAL",
  "FIELD OPERATIVES REQUESTED TO FILE INTELLIGENCE REPORTS",
  "CASE FILES AVAILABLE FOR IMMEDIATE SUBMISSION",
  "TRANSMISSION SECURE — PROCEED TO INTELLIGENCE PORTAL",
];

const CAPABILITIES = [
  { label: "CLEARANCE LEVEL", value: "OPERATIVE" },
  { label: "FORM CAPACITY", value: "UNLIMITED" },
  { label: "RESPONSE ANALYTICS", value: "ACTIVE" },
  { label: "EMAIL NOTIFICATIONS", value: "ENABLED" },
  { label: "CSV EXPORT", value: "AVAILABLE" },
  { label: "CLASSIFICATION", value: "PUBLIC / UNLISTED" },
];

const CONTACTS = [
  {
    label: "TWITTER",
    value: "@ayush__64",
    href: "https://x.com/ayush__64",
  },
  {
    label: "LINKEDIN",
    value: "AYUSH SHARMA",
    href: "https://www.linkedin.com/in/ayush-sharma-5b7938282/",
  },
  {
    label: "GITHUB",
    value: "@ayush__64",
    href: "https://github.com/allesko64/form-builder-saas",
  },
];

function RedactionBar({ width = "80px" }: { width?: string }) {
  return (
    <span
      className="inline-block shrink-0"
      style={{
        width,
        height: "10px",
        backgroundColor: "var(--color-redaction)",
        borderRadius: 0,
      }}
      aria-hidden
    />
  );
}

function OperativePhoto() {
  return (
    <figure className="group w-full">
      <div className="relative overflow-hidden border-2 border-[var(--color-ink)] transition-colors duration-300 group-hover:border-[var(--color-stamp)] group-hover:shadow-[4px_4px_0_var(--color-ink)]">
        <Image
          src="/operative.webp"
          alt="OPERATIVE — IDENTITY WITHHELD"
          width={400}
          height={533}
          className="w-full object-cover grayscale contrast-[1.2] transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:grayscale-0 group-hover:contrast-110"
          priority
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[var(--color-stamp)] opacity-0 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-[0.12]"
        />
      </div>
      <figcaption className="dossier-meta mt-2 block text-[var(--color-ink-faded)] transition-colors duration-300 group-hover:text-[var(--color-stamp)]">
        FIG. 1 — SURVEILLANCE RECORD · CASE #0042
      </figcaption>
    </figure>
  );
}

type CaseFileLine = {
  label: string;
  value?: ReactNode;
};

const CASE_FILE_LINES: CaseFileLine[] = [
  { label: "SUBJECT:", value: <RedactionBar /> },
  { label: "DATE FILED:", value: "19 MAY 2026" },
  { label: "HANDLER:", value: <RedactionBar /> },
  { label: "STATUS:", value: "AWAITING SUBMISSION" },
  {
    label: "CLEARANCE:",
    value: (
      <span className="flex items-center gap-2">
        <RedactionBar width="48px" />
        <span className="dossier-meta text-[var(--color-stamp)]">RESTRICTED</span>
      </span>
    ),
  },
];

function CaseFileBlock() {
  return (
    <div className="mt-6 border-t-2 border-[var(--color-ink)] pt-4">
      <p className="dossier-section-title">CASE FILE · REF: DTF-0042</p>
      <dl className="mt-3">
        {CASE_FILE_LINES.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-dashed border-[var(--color-ink-faded)] py-1.5"
          >
            <dt className="dossier-label">{label}</dt>
            <dd className="dossier-value">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ManilaFolderStamps() {
  return (
    <div className="relative mt-6 flex flex-col items-start gap-2">
      <DossierStamp variant="red" rotate={-12} size="md">
        TOP SECRET
      </DossierStamp>
      <div className="-mt-4 ml-6">
        <DossierStamp variant="brass" rotate={4} size="sm">
          DTF-0042
        </DossierStamp>
      </div>
    </div>
  );
}

const STATS = [
  { value: "∞", label: "FORMS", valueSize: "text-[2rem]" },
  { value: "2 MIN", label: "AVG FILING", valueSize: "text-[1rem]" },
  { value: "SECURE", label: "TRANSMISSION", valueSize: "text-[1rem]" },
];

function LeftColumnAtmosphere() {
  return (
    <div
      className="dossier-atmosphere relative min-h-[28rem] overflow-hidden px-6 py-10 pb-20 md:min-h-0 md:px-6 md:py-12 md:pb-12"
      style={{ backgroundColor: "var(--color-paper-dark)" }}
    >
      <div className="relative z-20 flex flex-col gap-0">
        <OperativePhoto />
        <CaseFileBlock />
        <ManilaFolderStamps />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <DossierPageShell tickerItems={TICKER_ITEMS}>
      <div className="relative min-h-[calc(100vh-3.5rem)]">
        <div className="relative grid min-h-[calc(100vh-3.5rem)] grid-cols-1 md:grid-cols-[minmax(240px,0.8fr)_2px_1.4fr_2px_minmax(200px,0.8fr)]">
          {/* ── LEFT — manila folder atmosphere (no CTAs / links) ── */}
          <LeftColumnAtmosphere />

          <div className="hidden bg-[var(--color-ink)] md:block" />

          {/* ── MIDDLE — hero panel (paper) ── */}
          <div
            className="relative z-10 flex min-h-[50vh] min-w-0 flex-col border-b border-[var(--color-ink-faded)] px-6 py-10 md:min-h-0 md:border-b-0 md:px-8 md:py-12"
            style={{ backgroundColor: "var(--color-paper)" }}
          >
            <div className="relative z-10 min-w-0">
              <p className="dossier-kicker text-[var(--color-ink)]">
                FIELD BRIEFING · PUBLIC TERMINAL
              </p>

              <h1 className="mt-8 font-[family-name:var(--font-playfair)] text-[2.75rem] font-black leading-[0.95] tracking-tight text-[var(--color-ink)] md:text-[3.25rem]">
                CLASSIFIED
                <br />
                FORM BUILDER
              </h1>

              <p className="dossier-body mt-6 max-w-md">
                Build forms. Collect intelligence. File reports.
              </p>
              <div className="mt-10 flex flex-col gap-3">
                <Link
                  href="/sign-up"
                  className="dossier-btn block rounded-none border-2 border-[var(--color-ink)] bg-[var(--color-ink)] px-5 py-3 text-center text-[var(--color-paper)] outline outline-2 outline-offset-[3px] outline-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
                >
                  BEGIN FILING →
                </Link>
                <Link
                  href="/sign-in"
                  className="dossier-btn group block rounded-none border-2 border-[var(--color-ink-faded)] bg-transparent px-5 py-3 text-center text-[var(--color-ink-faded)] outline outline-2 outline-offset-[3px] outline-transparent transition-all duration-300 hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] hover:text-[var(--color-ink)] hover:shadow-[4px_4px_0_var(--color-ink)] hover:outline-[var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                    EXISTING OPERATIVE →
                  </span>
                </Link>
              </div>

              <div className="mt-10 pt-4 pb-4 flex w-full flex-row items-end justify-between">
                {STATS.flatMap((stat, index) => [
                  <div key={`${stat.label}-item`} className="flex flex-col items-center gap-2">
                    <p
                      className={`font-[family-name:var(--font-playfair)] ${stat.valueSize} font-black leading-none text-[var(--color-ink)]`}
                    >
                      {stat.value}
                    </p>
                    <p className="font-[family-name:var(--font-courier)] text-[1rem] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-faded)] text-center">
                      {stat.label}
                    </p>
                  </div>,
                  index < STATS.length - 1 ? (
                    <div
                      key={`${stat.label}-divider`}
                      className="w-[1px] h-10 bg-[var(--color-ink-faded)] opacity-20 self-center"
                    />
                  ) : null,
                ])}
              </div>

              <div className="pt-12 flex justify-center">
                <div className="p-4 w-full max-w-md">
                  <DossierStamp variant="red" rotate={-8} size="md">
                    <div className="p-6 text-[1.05rem]">
                      <p className="dossier-section-title">INCOMING TRANSMISSION · CASE #0042</p>
                      <dl className="mt-3">
                        {[
                          { label: "FULL NAME", value: "AYUSH SHARMA" },
                          { label: "EMAIL ADDRESS", value: "a*******@gmail.com" },
                          { label: "AGE", value: "21" },
                          { label: "PHONE NUMBER", value: "+91 *** *** 9584" },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="flex items-center justify-between border-b border-dashed border-[var(--color-ink-faded)] py-1.5"
                          >
                            <dt className="dossier-label">{label}:</dt>
                            <dd className="dossier-value">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </DossierStamp>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden bg-[var(--color-ink)] md:block" />

          {/* ── RIGHT — nav + capabilities ── */}
          <div
            className="relative z-10 flex flex-col px-6 py-10 md:px-6 md:py-12"
            style={{ backgroundColor: "var(--color-paper-dark)" }}
          >
            <nav className="mb-8 space-y-4 border-b-2 border-[var(--color-ink)] pb-8">
              <Link
                href="/explore"
                className="block whitespace-nowrap font-[family-name:var(--font-courier)] text-sm font-bold uppercase tracking-[0.05em] text-[var(--color-ink)] transition-colors hover:text-[var(--color-stamp)]"
              >
                EXPLORE PUBLIC DOSSIERS →
              </Link>
              <Link
                href="/pricing"
                className="block whitespace-nowrap font-[family-name:var(--font-courier)] text-sm font-bold uppercase tracking-[0.05em] text-[var(--color-ink)] transition-colors hover:text-[var(--color-stamp)]"
              >
                PRICING →
              </Link>
            </nav>

            <p className="dossier-section-title mb-6 border-b-2 border-[var(--color-ink)] pb-2">
              INTELLIGENCE BRIEF
            </p>

            <div className="space-y-4">
              {CAPABILITIES.map(({ label, value }) => (
                <div key={label}>
                  <p className="dossier-label">{label}</p>
                  <p className="font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--color-ink)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <DossierStamp variant="brass" rotate={5} size="xs">
                LEVEL 5 ACCESS
              </DossierStamp>
            </div>

            <div className="pt-8 mb-6" />

            <p className="font-[family-name:var(--font-courier)] text-[1rem] font-bold uppercase tracking-[0.2em] text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-2 mb-5">
              INTELLIGENCE CONTACTS
            </p>

            <div className="space-y-4">
              {CONTACTS.map(({ label, value, href }) => (
                <div key={label}>
                  <p className="dossier-label">{label}</p>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--color-ink)] hover:text-[var(--color-stamp)] transition-colors duration-200 after:content-['_→'] after:font-[family-name:var(--font-courier)] after:text-sm"
                  >
                    {value}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ClassifiedWatermark />
      </div>
    </DossierPageShell>
  );
}
