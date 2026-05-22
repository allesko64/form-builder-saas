import type * as React from "react";

import { cn } from "~/lib/utils";

export type DossierRowActionVariant = "default" | "muted" | "danger";

const variantClass: Record<DossierRowActionVariant, string> = {
  default:
    "dossier-meta text-[var(--color-ink-faded)] hover:text-[var(--color-stamp)] disabled:opacity-50",
  muted:
    "dossier-meta text-[var(--color-ink-faded)] hover:text-[var(--color-stamp)] disabled:opacity-50",
  danger:
    "dossier-meta text-[var(--color-stamp)] hover:underline disabled:opacity-50",
};

export function dossierRowActionClass(
  variant: DossierRowActionVariant = "default",
  className?: string,
) {
  return cn(variantClass[variant], className);
}

type DossierRowActionProps = React.ComponentProps<"button"> & {
  variant?: DossierRowActionVariant;
};

/** Compact text action for dossier list rows (publish, link copy, etc.). */
export function DossierRowAction({
  children,
  variant = "default",
  className,
  type = "button",
  ...props
}: DossierRowActionProps) {
  return (
    <button
      type={type}
      className={dossierRowActionClass(variant, className)}
      {...props}
    >
      {children}
    </button>
  );
}
