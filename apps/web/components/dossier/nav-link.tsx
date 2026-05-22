import Link from "next/link";
import type * as React from "react";

import { cn } from "~/lib/utils";

export type DossierNavLinkVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";

const variantClass: Record<DossierNavLinkVariant, string> = {
  primary:
    "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] outline outline-2 outline-offset-[3px] outline-[var(--color-ink)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]",
  secondary:
    "border-[var(--color-ink-faded)] bg-transparent text-[var(--color-ink-faded)] outline outline-2 outline-offset-[3px] outline-transparent hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] hover:text-[var(--color-ink)] hover:shadow-[4px_4px_0_var(--color-ink)] hover:outline-[var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  accent:
    "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper)] outline outline-2 outline-offset-[3px] outline-[var(--color-stamp)] hover:bg-[var(--color-paper)] hover:text-[var(--color-stamp)]",
  ghost:
    "border-[var(--color-ink-faded)] bg-transparent text-[var(--color-ink-faded)] outline-none hover:border-[var(--color-stamp)] hover:text-[var(--color-stamp)]",
  danger:
    "border-[var(--color-stamp-faded)] bg-transparent text-[var(--color-stamp-faded)] outline outline-2 outline-offset-[3px] outline-transparent hover:border-[var(--color-stamp)] hover:bg-[var(--color-paper-dark)] hover:text-[var(--color-stamp)] hover:shadow-[4px_4px_0_var(--color-stamp)] hover:outline-[var(--color-stamp)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
};

const activeVariantClass: Record<DossierNavLinkVariant, string> = {
  primary:
    "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper)] outline-[var(--color-stamp)] hover:bg-[var(--color-paper)] hover:text-[var(--color-stamp)]",
  secondary:
    "border-[var(--color-ink)] bg-[var(--color-paper-dark)] text-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] outline-[var(--color-ink)]",
  accent:
    "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper)] outline-[var(--color-stamp)]",
  ghost: "border-[var(--color-stamp)] text-[var(--color-stamp)]",
  danger:
    "border-[var(--color-stamp)] bg-[var(--color-paper-dark)] text-[var(--color-stamp)] shadow-[4px_4px_0_var(--color-stamp)] outline-[var(--color-stamp)]",
};

const symmetricNavClass = "min-w-[5.5rem] justify-center text-center md:min-w-[6.25rem]";

const baseNavClass =
  "dossier-btn inline-flex shrink-0 items-center rounded-none border-2 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] transition-all duration-200 md:px-4 md:py-2 md:text-[0.7rem]";

export function dossierNavClass(
  variant: DossierNavLinkVariant = "secondary",
  active = false,
  options?: { symmetric?: boolean; className?: string },
) {
  return cn(
    baseNavClass,
    active ? activeVariantClass[variant] : variantClass[variant],
    options?.symmetric && symmetricNavClass,
    options?.className,
  );
}

type DossierNavLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: DossierNavLinkVariant;
  active?: boolean;
  symmetric?: boolean;
  className?: string;
};

/** Themed navigation control — matches landing `dossier-btn` primary/secondary pair. */
export function DossierNavLink({
  href,
  children,
  variant = "secondary",
  active = false,
  symmetric = false,
  className,
}: DossierNavLinkProps) {
  return (
    <Link href={href} className={dossierNavClass(variant, active, { symmetric, className })}>
      {children}
    </Link>
  );
}

type DossierNavButtonProps = React.ComponentProps<"button"> & {
  variant?: DossierNavLinkVariant;
  active?: boolean;
  symmetric?: boolean;
};

/** Same styling as `DossierNavLink` for non-navigation actions (e.g. sign out). */
export function DossierNavButton({
  children,
  variant = "ghost",
  active = false,
  symmetric = false,
  className,
  type = "button",
  ...props
}: DossierNavButtonProps) {
  return (
    <button
      type={type}
      className={dossierNavClass(variant, active, { symmetric, className })}
      {...props}
    >
      {children}
    </button>
  );
}
