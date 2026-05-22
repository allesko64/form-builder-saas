"use client";

/**
 * DossierStamp — rubber stamp aesthetic with a framer-motion entrance.
 *
 * ── Framer Motion concepts used here ──────────────────────────────────
 *
 * 1. `motion.div`
 *    The core primitive. It's a plain <div> that accepts animation props:
 *    `initial`, `animate`, `exit`, `transition`, `whileHover`, `whileTap`.
 *    Framer interpolates between those states automatically.
 *
 * 2. `initial` → the state BEFORE the element mounts (invisible, oversized).
 * 3. `animate` → the state the element animates TO after mounting.
 *    Together these create the "stamp slams down" entrance effect.
 *
 * 4. `transition`
 *    Controls HOW the animation runs.
 *    - `duration` — how long in seconds.
 *    - `ease: [0.22, 1, 0.36, 1]` — a cubic-bezier curve. These four numbers
 *      define a Bézier handle. This particular curve starts fast and decelerates
 *      hard at the end — the "slap" feel of a rubber stamp.
 *
 * 5. `whileHover`
 *    Framer watches the hover state and animates to these values while the
 *    cursor is over the element, reverting when it leaves. No CSS :hover needed.
 */

import { motion } from "framer-motion";

import { cn } from "~/lib/utils";

type StampVariant = "red" | "brass" | "ink";
type StampSize = "xs" | "sm" | "md" | "lg";

const sizeClass: Record<StampSize, string> = {
  xs: "px-2 py-1 text-[length:var(--dossier-text-meta)]",
  sm: "px-3 py-1.5 text-[length:var(--dossier-text-label)]",
  md: "px-4 py-2 text-[length:var(--dossier-text-label)]",
  lg: "px-6 py-3 text-base",
};

const variantColor: Record<StampVariant, string> = {
  red: "var(--color-stamp)",
  brass: "var(--color-brass)",
  ink: "var(--color-ink)",
};

type DossierStampProps = {
  variant?: StampVariant;
  size?: StampSize;
  rotate?: number;
  className?: string;
  children: React.ReactNode;
};

export function DossierStamp({
  variant = "red",
  size = "md",
  rotate = -12,
  className,
  children,
}: DossierStampProps) {
  const color = variantColor[variant];

  return (
    <motion.div
      className={cn(
        "inline-block select-none border-2 font-[family-name:var(--font-courier)] font-bold uppercase tracking-[var(--dossier-tracking-meta)]",
        sizeClass[size],
        className,
      )}
      style={{ color, borderColor: color, boxShadow: `2px 2px 0 ${color}` }}
      initial={{ scale: 1.5, opacity: 0, rotate: rotate - 4 }}
      animate={{ scale: 1, opacity: 0.9, rotate }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.06, opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}
