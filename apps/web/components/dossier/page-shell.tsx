/**
 * DossierPageShell — full-page wrapper matching auth page atmosphere.
 * Uses the same paper tones, halftone/grain overlays, and masthead as sign-in/sign-up.
 */

import { FoldMarkOverlay, HalftoneOverlay, PaperGrainOverlay } from "./paper-overlay";
import { DossierMasthead } from "./masthead";
import { DossierTicker } from "./ticker";

type PageShellProps = {
  children: React.ReactNode;
  classification?: string;
  tickerItems?: string[];
};

export function DossierPageShell({
  children,
  classification,
  tickerItems,
}: PageShellProps) {
  return (
    <div className="dossier-theme relative min-h-screen overflow-x-hidden">
      <PaperGrainOverlay />
      <HalftoneOverlay />
      <FoldMarkOverlay />

      <div className="relative z-10 flex min-h-screen flex-col">
        <DossierMasthead classification={classification} />
        <main className="flex-1 pb-10">{children}</main>
      </div>

      <DossierTicker items={tickerItems} />
    </div>
  );
}
