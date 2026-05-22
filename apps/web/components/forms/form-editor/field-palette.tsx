"use client";

import type { FormFieldType } from "@repo/types";
import { FIELD_TYPE_CATALOG } from "~/lib/form-types";

type FieldPaletteProps = {
  onAddAction: (type: FormFieldType) => void;
  disabled?: boolean;
};

export function FieldPalette({ onAddAction, disabled }: FieldPaletteProps) {
  return (
    <div className="space-y-2">
      <p className="border-b border-[var(--color-ink-faded)] pb-2 dossier-kicker text-[var(--color-ink)]">
        DIRECTIVE TYPES
      </p>
      {FIELD_TYPE_CATALOG.map((item) => (
        <button
          key={item.type}
          type="button"
          disabled={disabled}
          onClick={() => onAddAction(item.type)}
          className="w-full border border-[var(--color-ink-faded)] bg-[var(--color-paper)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] disabled:opacity-50"
        >
          <span className="dossier-label block text-[var(--color-ink)]">+ {item.label}</span>
          <span className="dossier-body mt-1 block text-sm">{item.description}</span>
        </button>
      ))}
    </div>
  );
}
