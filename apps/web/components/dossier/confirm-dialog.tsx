"use client";

/**
 * DossierConfirmDialog — dossier-themed replacement for browser confirm().
 *
 * Supports two modes:
 *
 * 1. UNCONTROLLED (trigger-as-child) — use when the trigger button is here:
 *    <DossierConfirmDialog title="..." onConfirm={fn} triggerClassName="...">
 *      DESTROY
 *    </DossierConfirmDialog>
 *    The dialog manages its own open state via the Radix trigger.
 *
 * 2. CONTROLLED — use when the trigger is elsewhere (e.g. inside a child list):
 *    <DossierConfirmDialog
 *      title="..."
 *      open={!!pendingId}
 *      onOpenChange={(v) => !v && setPendingId(null)}
 *      onConfirm={() => { doThing(pendingId); setPendingId(null); }}
 *    />
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { cn } from "~/lib/utils";

type DossierConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red stamp-style confirm button instead of ink. */
  destructive?: boolean;
  onConfirm: () => void;

  // ── Controlled mode ──────────────────────────────────────────
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // ── Uncontrolled / trigger-as-child mode ─────────────────────
  /** Label for the trigger button rendered by this component. */
  children?: React.ReactNode;
  triggerClassName?: string;
  triggerDisabled?: boolean;
};

export function DossierConfirmDialog({
  title,
  description,
  confirmLabel = "CONFIRM",
  cancelLabel = "STAND DOWN",
  destructive = false,
  onConfirm,
  open,
  onOpenChange,
  children,
  triggerClassName,
  triggerDisabled,
}: DossierConfirmDialogProps) {
  const isControlled = open !== undefined;

  return (
    <AlertDialog {...(isControlled ? { open, onOpenChange } : {})}>
      {/* Only render a trigger when in uncontrolled mode */}
      {!isControlled && children !== undefined && (
        <AlertDialogTrigger asChild>
          <button type="button" disabled={triggerDisabled} className={triggerClassName}>
            {children}
          </button>
        </AlertDialogTrigger>
      )}

      <AlertDialogContent
        className={cn(
          // Override shadcn defaults to match dossier aesthetic
          "rounded-none border-2 border-[var(--color-ink)] bg-[var(--color-paper)]",
          "p-0 shadow-[5px_5px_0_var(--color-ink)]",
          // Remove default rounded from the portal overlay
          "[&_.bg-background]:rounded-none",
          "sm:max-w-md",
        )}
      >
        {/* ── Masthead strip ──────────────────────────────────── */}
        <div className="border-b-2 border-[var(--color-ink)] px-6 py-3">
          <p className="dossier-meta text-[var(--color-ink-faded)]">
            CONFIRMATION REQUIRED · CLEARANCE LEVEL: OPERATIVE
          </p>
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="px-6 py-6">
          <AlertDialogHeader className="gap-3 text-left">
            <AlertDialogTitle className="font-[family-name:var(--font-playfair)] text-xl font-black text-[var(--color-ink)]">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="dossier-body text-sm text-[var(--color-ink-faded)]">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* ── Buttons ─────────────────────────────────────── */}
          <AlertDialogFooter className="mt-7 flex-row gap-3">
            <AlertDialogCancel
              className={cn(
                "flex-1 rounded-none border-2 border-[var(--color-ink-faded)] bg-transparent",
                "px-4 py-2.5 font-[family-name:var(--font-courier)] text-xs font-bold uppercase",
                "tracking-widest text-[var(--color-ink-faded)]",
                "transition-colors hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] hover:text-[var(--color-ink)]",
              )}
            >
              {cancelLabel}
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={onConfirm}
              className={cn(
                "flex-1 rounded-none border-2 px-4 py-2.5",
                "font-[family-name:var(--font-courier)] text-xs font-bold uppercase tracking-widest",
                "transition-colors",
                destructive
                  ? "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper)] hover:bg-[var(--color-stamp-faded)] hover:border-[var(--color-stamp-faded)]"
                  : "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-faded)]",
              )}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
