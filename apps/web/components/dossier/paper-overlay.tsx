/**
 * Atmospheric overlays — replicate aged paper, halftone dots, and fold marks.
 * All are `aria-hidden` pointer-events-none so they never block interaction.
 */

export function PaperGrainOverlay() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.06] mix-blend-multiply"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="paper-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
  );
}

export function HalftoneOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-[0.15]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Ccircle cx='1' cy='1' r='1' fill='%233A3228'/%3E%3C/svg%3E")`,
        backgroundSize: "8px 8px",
      }}
    />
  );
}

export function FoldMarkOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage: [
          "linear-gradient(135deg, transparent 48%, color-mix(in srgb, var(--color-ink-faded) 6%, transparent) 49%, color-mix(in srgb, var(--color-ink-faded) 6%, transparent) 51%, transparent 52%)",
          "linear-gradient(-135deg, transparent 48%, color-mix(in srgb, var(--color-ink-faded) 4%, transparent) 49%, color-mix(in srgb, var(--color-ink-faded) 4%, transparent) 51%, transparent 52%)",
        ].join(", "),
      }}
    />
  );
}
