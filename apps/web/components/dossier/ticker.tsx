"use client";

/**
 * DossierTicker — the scrolling news strip at the bottom of every page.
 *
 * ── Framer Motion concepts used here ──────────────────────────────────
 *
 * This is a classic "marquee" / infinite ticker pattern.
 *
 * 1. `animate={{ x: ["0%", "-50%"] }}`
 *    When `animate` receives an *array*, Framer animates through each value
 *    in sequence: start → end, then (because of `repeat: Infinity`) loops
 *    back to the start. This is called a "keyframe" animation.
 *
 *    Why "-50%"? We render the ticker text TWICE side-by-side inside a
 *    `whitespace-nowrap w-max` container, so its total width is 2× one copy.
 *    Sliding left by 50% of that total width lands us exactly at the start
 *    of the second copy — which looks identical to the start of the first.
 *    Framer then instantly snaps back to 0% before the next iteration,
 *    creating a seamless, infinite loop with zero visible jump.
 *
 * 2. `transition.ease: "linear"`
 *    Most animations use curves (ease-in, ease-out) to feel natural.
 *    For a ticker you want *constant speed*, so "linear" is essential.
 *    Any easing curve would make the text appear to speed up or slow down.
 *
 * 3. `transition.repeat: Infinity`
 *    Loops the keyframe sequence forever. Combined with `repeatType: "loop"`
 *    (the default) it restarts from 0% each time.
 */

import { motion } from "framer-motion";

const DEFAULT_ITEMS = [
  "TRANSMISSION SECURE",
  "FIELD OPERATIVE ACTIVE",
  "ENCRYPTION PROTOCOL ENGAGED",
  "CASE FILES ACCESSIBLE",
  "INTELLIGENCE GATHERING IN PROGRESS",
  "DOSSIER SYSTEM ONLINE",
];

type TickerProps = {
  items?: string[];
};

export function DossierTicker({ items = DEFAULT_ITEMS }: TickerProps) {
  // Build a single string from all items separated by a divider glyph
  const text = items.map((item) => `— ${item} `).join("") + " ";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden border-t-2 border-[var(--color-ink)] py-1.5"
      style={{ backgroundColor: "var(--color-ink)" }}
    >
      {/*
       * The motion.div width is `w-max` (as wide as its content).
       * It holds the ticker text printed twice end-to-end.
       * Sliding it left by 50% of its own width lands on the second copy —
       * identical to the first — so the loop is seamless.
       */}
      <motion.div
        className="flex w-max whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      >
        <span className="dossier-meta text-[var(--color-paper)]">{text}</span>
        {/* Second copy — makes the -50% snap seamless */}
        <span className="dossier-meta text-[var(--color-paper)]">{text}</span>
      </motion.div>
    </div>
  );
}
