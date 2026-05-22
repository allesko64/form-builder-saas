"use client";

import type { RouterOutputs } from "@repo/trpc/client";
import { cn } from "~/lib/utils";

type Field = RouterOutputs["form"]["getById"]["fields"][number];

const inputClass =
  "w-full rounded-none border border-dotted border-[var(--color-ink-faded)] bg-[color-mix(in_srgb,var(--color-paper-dark)_40%,transparent)] px-3 py-2.5 font-[family-name:var(--font-courier)] text-base text-[var(--color-ink)] placeholder:text-[var(--color-placeholder)] focus:border-2 focus:border-solid focus:border-[var(--color-ink)] focus:bg-[var(--color-paper)] focus:outline-none";

type FormFieldRendererProps = {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  showLabel?: boolean;
};

export function FormFieldRenderer({
  field,
  value,
  onChange,
  disabled,
  showLabel = true,
}: FormFieldRendererProps) {
  const options = field.validationConfig?.options ?? [];

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block dossier-label text-[var(--color-ink-faded)]">
          {field.label}
          {field.required ? (
            <span className="ml-2 text-[var(--color-stamp)]">· MANDATORY</span>
          ) : null}
        </label>
      )}
      {field.helpText ? (
        <p className="dossier-body text-sm">
          {field.helpText}
        </p>
      ) : null}

      {field.type === "short_text" || field.type === "email" ? (
        <input
          type={field.type === "email" ? "email" : "text"}
          className={inputClass}
          placeholder={field.placeholder ?? undefined}
          value={(value as string) ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}

      {field.type === "long_text" ? (
        <textarea
          className={cn(inputClass, "min-h-[100px] resize-y")}
          placeholder={field.placeholder ?? undefined}
          value={(value as string) ?? ""}
          disabled={disabled}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}

      {field.type === "number" ? (
        <input
          type="number"
          className={inputClass}
          placeholder={field.placeholder ?? undefined}
          value={value === null || value === undefined ? "" : String(value)}
          disabled={disabled}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
        />
      ) : null}

      {field.type === "date" ? (
        <input
          type="date"
          className={inputClass}
          value={(value as string) ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}

      {field.type === "checkbox" ? (
        <label className="flex cursor-pointer items-center gap-3 font-[family-name:var(--font-courier)] text-sm text-[var(--color-ink)]">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-ink)]"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.placeholder ?? "Confirm"}
        </label>
      ) : null}

      {field.type === "single_select" ? (
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 font-[family-name:var(--font-courier)] text-sm text-[var(--color-ink)]"
            >
              <input
                type="radio"
                name={field.id}
                checked={value === opt}
                disabled={disabled}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      ) : null}

      {field.type === "multi_select" ? (
        <div className="space-y-2">
          {options.map((opt) => {
            const selected = Array.isArray(value) ? (value as string[]) : [];
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 font-[family-name:var(--font-courier)] text-sm text-[var(--color-ink)]"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-ink)]"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, opt]);
                    else onChange(selected.filter((s) => s !== opt));
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      ) : null}

      {field.type === "rating" ? (
        <div className="flex gap-2">
          {Array.from({ length: field.validationConfig?.max ?? 5 }, (_, i) => i + 1).map(
            (n) => (
              <button
                key={n}
                type="button"
                disabled={disabled}
                className={cn(
                  "border-2 px-3 py-2 font-[family-name:var(--font-courier)] text-sm font-bold transition-colors",
                  value === n
                    ? "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper)]"
                    : "border-[var(--color-ink-faded)] text-[var(--color-ink-faded)] hover:border-[var(--color-ink)]",
                )}
                onClick={() => onChange(n)}
              >
                {n}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
