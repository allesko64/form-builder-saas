/**
 * Atmospheric overlays — replicate aged paper grain.
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
