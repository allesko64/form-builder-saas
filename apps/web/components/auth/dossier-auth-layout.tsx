import { dossierColorVar } from "~/components/auth/dossier-tokens";
import { DossierMasthead } from "~/components/dossier/masthead";
import { PaperGrainOverlay } from "~/components/dossier/paper-overlay";

const REDACTED_LINES = [
  "Subject maintained contact with ████████ division through encrypted channels.",
  "Field report ████-██ indicates anomalous activity near the northern sector.",
  "Asset designation REDACTED pending verification by supervisory committee.",
  "Intercepted transmission references operation ████████ — contents sealed.",
];

type DossierAuthLayoutProps = {
  headline: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function DossierAuthLayout({
  headline,
  description,
  children,
  footer,
}: DossierAuthLayoutProps) {
  return (
    <div
      className="dossier-theme relative min-h-screen overflow-hidden"
      style={{ backgroundColor: dossierColorVar.paper }}
    >
      <PaperGrainOverlay />

      <div className="relative z-10 flex min-h-screen flex-col">
        <DossierMasthead />

        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Left briefing panel */}
          <aside
            className="relative flex flex-1 flex-col justify-between border-b border-[var(--color-ink-faded)] p-8 lg:border-b-0 lg:border-r lg:p-12"
            style={{ backgroundColor: dossierColorVar.paperDark }}
          >
            {/* CLASSIFIED watermark */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
            >
              <span
                className="select-none font-[family-name:var(--font-courier)] text-[5rem] font-bold uppercase tracking-[0.3em] lg:text-[7rem]"
                style={{
                  color: dossierColorVar.stamp,
                  opacity: 0.08,
                  transform: "rotate(-15deg)",
                }}
              >
                CLASSIFIED
              </span>
            </div>

            <div className="relative z-10">
              <p className="dossier-kicker text-[var(--color-ink)]">
                RESTRICTED ACCESS PORTAL · FIELD BRIEFING
              </p>

              <h1 className="mt-8 font-[family-name:var(--font-playfair)] text-4xl leading-tight text-[var(--color-ink)] lg:text-5xl">
                {headline}
              </h1>

              <p className="mt-6 max-w-md dossier-body">
                {description}
              </p>

              <div className="mt-10 space-y-3 border-l-2 border-[var(--color-ink-faded)] pl-4">
                {REDACTED_LINES.map((line, i) => (
                  <p
                    key={i}
                    className="font-[family-name:var(--font-lora)] text-sm leading-relaxed text-[var(--color-ink-muted)]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <p
              className="dossier-caption relative z-10 mt-12 text-[var(--color-brass)]"
            >
              CASE #AUTH-2026 · CLASSIFICATION: RESTRICTED
            </p>
          </aside>

          {/* Right form panel */}
          <main
            className="flex flex-1 flex-col justify-center p-8 lg:p-12"
            style={{ backgroundColor: dossierColorVar.paper }}
          >
            <div className="mx-auto w-full max-w-md">{children}</div>
            {footer ? (
              <div className="mx-auto mt-6 w-full max-w-md border-t border-dashed border-[var(--color-ink-faded)] pt-4 text-center dossier-meta text-[var(--color-ink-faded)]">
                {footer}
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
