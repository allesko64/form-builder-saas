"use client";

import * as React from "react";
import Link from "next/link";
import { useFormField } from "~/components/ui/form";
import { cn } from "~/lib/utils";

const inputClassName =
  "w-full rounded-none border border-dotted border-[var(--color-ink-faded)] bg-[color-mix(in_srgb,var(--color-paper-dark)_40%,transparent)] px-3 py-2.5 font-[family-name:var(--font-courier)] text-base text-[var(--color-ink)] placeholder:text-[var(--color-placeholder)] placeholder:opacity-100 focus:border-2 focus:border-solid focus:border-[var(--color-ink)] focus:bg-[var(--color-paper)] focus:outline-none focus:ring-0";

export const DossierInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function DossierInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClassName, className)} {...props} />;
  },
);

export function DossierLabel({ className, children, ...props }: React.ComponentProps<"label">) {
  return (
    <label className={cn("dossier-label mb-1 block", className)} {...props}>
      {children}
    </label>
  );
}

type DossierButtonProps = React.ComponentProps<"button"> & {
  isSubmitting?: boolean;
  submittingText?: string;
};

export function DossierButton({
  className,
  children,
  isSubmitting,
  submittingText = "PROCESSING REQUEST...",
  disabled,
  type = "button",
  ...props
}: DossierButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled ?? isSubmitting}
      className={cn(
        "dossier-btn w-full rounded-none border-2 border-[var(--color-ink)] bg-[var(--color-ink)] px-0 py-[14px] text-[var(--color-paper)] outline outline-2 outline-offset-[3px] outline-[var(--color-ink)] transition-colors active:scale-[0.97] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {isSubmitting ? submittingText : children}
    </button>
  );
}

export function DossierDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-[var(--color-ink-faded)]" />
      <span className="dossier-meta">OR</span>
      <span className="h-px flex-1 bg-[var(--color-ink-faded)]" />
    </div>
  );
}

export function DossierLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("dossier-nav text-[var(--color-stamp)] hover:underline", className)}
    >
      {children}
    </Link>
  );
}

export function DossierFormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;

  if (!body) {
    return null;
  }

  return (
    <p
      id={formMessageId}
      className={cn("dossier-meta mt-1 text-[var(--color-stamp)]", className)}
      {...props}
    >
      ✗ {body}
    </p>
  );
}

export function DossierFormPanelTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "dossier-section-title mb-6 border-b border-[var(--color-ink-faded)] pb-3",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function DossierFooterText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "dossier-meta mt-8 border-t border-dashed border-[var(--color-ink-faded)] pt-4 text-center",
        className,
      )}
    >
      {children}
    </p>
  );
}
