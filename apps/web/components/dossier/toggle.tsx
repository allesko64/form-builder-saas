"use client";

/**
 * DossierToggle — a two-state stamp-style toggle for boolean settings.
 *
 * Renders two adjacent rectangular buttons (OFF / ON).
 * No rounded corners, no modern switch track — fully dossier-themed.
 * Accessibility: uses role="group" + two role="radio" buttons.
 */

import { cn } from "~/lib/utils";

type DossierToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  offLabel?: string;
  onLabel?: string;
  className?: string;
};

export function DossierToggle({
  checked,
  onChange,
  label,
  description,
  offLabel = "INACTIVE",
  onLabel = "ACTIVE",
  className,
}: DossierToggleProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="dossier-label text-[var(--color-ink)]">{label}</p>

      <div role="group" aria-label={label} className="flex">
        {/* OFF button */}
        <button
          type="button"
          role="radio"
          aria-checked={!checked}
          onClick={() => onChange(false)}
          className={cn(
            "border-2 px-4 py-2 font-[family-name:var(--font-courier)] text-xs font-bold uppercase tracking-widest transition-colors",
            !checked
              ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
              : "border-[var(--color-ink-faded)] text-[var(--color-ink-faded)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
          )}
        >
          {offLabel}
        </button>

        {/* ON button — left border removed to merge the two into one block */}
        <button
          type="button"
          role="radio"
          aria-checked={checked}
          onClick={() => onChange(true)}
          className={cn(
            "-ml-[2px] border-2 px-4 py-2 font-[family-name:var(--font-courier)] text-xs font-bold uppercase tracking-widest transition-colors",
            checked
              ? "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper)] z-10 relative"
              : "border-[var(--color-ink-faded)] text-[var(--color-ink-faded)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
          )}
        >
          {onLabel}
        </button>
      </div>

      {description && (
        <p className="dossier-caption text-[var(--color-ink-muted)]">{description}</p>
      )}
    </div>
  );
}
