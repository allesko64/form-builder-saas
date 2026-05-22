type ClassifiedWatermarkProps = {
  opacity?: number;
};

/** Toned background stamp — landing default is subtler than auth (0.08). */
export function ClassifiedWatermark({ opacity = 0.05 }: ClassifiedWatermarkProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden"
    >
      <span
        className="select-none font-[family-name:var(--font-courier)] text-[5rem] font-bold uppercase tracking-[0.3em] lg:text-[7rem]"
        style={{
          color: "var(--color-stamp)",
          opacity,
          transform: "rotate(-15deg)",
        }}
      >
        CLASSIFIED
      </span>
    </div>
  );
}
