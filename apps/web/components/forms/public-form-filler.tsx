"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@repo/auth/client";
import { buildZodSchema, getVisibleFields, pruneHiddenAnswers } from "@repo/validators";
import { toast } from "sonner";
import { z } from "zod";

import { DossierButton } from "~/components/auth/dossier-fields";
import { DossierStamp } from "~/components/dossier/stamp";
import { FormFieldRenderer } from "~/components/forms/form-field-renderer";
import { SubmitSuccessScreen } from "~/components/forms/submit-success-screen";
import { DossierToggle } from "~/components/dossier/toggle";
import { usePrefillEmailFields } from "~/hooks/use-prefill-email-fields";
import { getSubmissionReceipts, saveSubmissionReceipt } from "~/lib/submission-receipts";
import { trpc } from "~/trpc/client";

type PublicFormFillerProps = {
  slug: string;
};

// Slide-across-the-desk transition: old page exits left, new page enters from right
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "70%" : "-70%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? "-70%" : "70%",
    opacity: 0,
  }),
};

export function PublicFormFiller({ slug }: PublicFormFillerProps) {
  const [submissionId] = useState(() => crypto.randomUUID());
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // 1 = moving forward (right to left), -1 = moving backward (left to right)
  const [direction, setDirection] = useState(1);
  const [showRecorded, setShowRecorded] = useState(false);
  // Respondent's opt-in for confirmation email
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);
  // Client-side duplicate guard: existing submission found in localStorage
  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);
  const [receiptCheckDone, setReceiptCheckDone] = useState(false);

  const startMsRef = useRef<number | null>(null);

  const { data: session } = useSession();
  const { data: form, isPending, isError, error } = trpc.public.getForm.useQuery({ slug });

  const canOfferConfirmationEmail = !!form?.collectRespondentEmail && !!session?.user;

  const { showAutofillHint } = usePrefillEmailFields(
    form?.id,
    form?.fields,
    session?.user?.email,
    setAnswers,
  );

  // Server enforces one submission per terminal (IP hash); localStorage is UX-only.
  useEffect(() => {
    if (form?.existingTerminalSubmissionId) {
      setExistingSubmissionId(form.existingTerminalSubmissionId);
      setReceiptCheckDone(true);
      return;
    }
    const receipts = getSubmissionReceipts(slug);
    if (receipts.length > 0 && receipts[0]) {
      setExistingSubmissionId(receipts[0].submissionId);
    }
    setReceiptCheckDone(true);
  }, [slug, form?.existingTerminalSubmissionId]);

  const { mutate: recordFunnelProgress } = trpc.public.recordFunnelProgress.useMutation();
  const lastRecordedFunnelRef = useRef<{ formId: string; stepIndex: number } | null>(null);

  const submitMutation = trpc.public.submit.useMutation({
    onSuccess: () => {
      saveSubmissionReceipt(slug, submissionId);
      setSubmitted(true);
    },
    onError: (err) => {
      if (err.data?.code === "FORBIDDEN" && /already submitted/i.test(err.message)) {
        saveSubmissionReceipt(slug, submissionId);
        setExistingSubmissionId(submissionId);
      }
      toast.error(err.message ?? "Transmission failed");
    },
  });

  const zodSchema = useMemo(() => {
    if (!form) return null;
    return buildZodSchema(form.fields, answers);
  }, [form, answers]);

  const visibleFields = useMemo(() => {
    if (!form) return [];
    return getVisibleFields(form.fields, answers);
  }, [form, answers]);

  // Drop answers for directives that became hidden when dependencies change.
  useEffect(() => {
    if (!form) return;
    setAnswers((prev) => {
      const pruned = pruneHiddenAnswers(form.fields, prev);
      if (Object.keys(pruned).length === Object.keys(prev).length) return prev;
      return pruned;
    });
  }, [form, answers]);

  useEffect(() => {
    setCurrentStep((s) => Math.min(s, Math.max(0, visibleFields.length - 1)));
  }, [visibleFields.length]);

  useEffect(() => {
    if (!form?.id || existingSubmissionId) return;
    const last = lastRecordedFunnelRef.current;
    if (last?.formId === form.id && last.stepIndex === currentStep) return;

    lastRecordedFunnelRef.current = { formId: form.id, stepIndex: currentStep };
    recordFunnelProgress({ formId: form.id, stepIndex: currentStep });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.id, currentStep, existingSubmissionId]);

  const showEmailToggle = (isLastStep: boolean) => isLastStep && canOfferConfirmationEmail;

  function markStarted() {
    if (startMsRef.current === null) {
      startMsRef.current = Date.now();
    }
  }

  function handleChange(fieldId: string, value: unknown) {
    markStarted();
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  function validateCurrentField(): boolean {
    if (!zodSchema || visibleFields.length === 0) return true;
    const field = visibleFields[currentStep];
    if (!field) return true;

    const partialSchema = buildZodSchema([field], answers);
    const result = partialSchema.safeParse({ [field.id]: answers[field.id] });

    if (!result.success) {
      const issues = z.flattenError(result.error).fieldErrors as Record<string, string[] | undefined>;
      const next: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(issues)) {
        if (msgs?.[0]) next[key] = msgs[0];
      }
      setFieldErrors(next);
      return false;
    }

    setFieldErrors({});
    return true;
  }

  function handleAdvance() {
    if (!validateCurrentField()) return;

    if (currentStep < visibleFields.length - 1) {
      setShowRecorded(true);
      setTimeout(() => setShowRecorded(false), 700);
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      handleFinalSubmit();
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
      setFieldErrors({});
    }
  }

  function handleFinalSubmit() {
    if (!form || !zodSchema) return;

    const parsed = zodSchema.safeParse(answers);
    if (!parsed.success) {
      const issues = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
      const next: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(issues)) {
        if (msgs?.[0]) next[key] = msgs[0];
      }
      setFieldErrors(next);
      toast.error("Complete all mandatory directives");
      return;
    }

    const completionTimeMs =
      startMsRef.current !== null ? Date.now() - startMsRef.current : undefined;

    submitMutation.mutate({
      formId: form.id,
      submissionId,
      answers: parsed.data,
      completionTimeMs,
      sendConfirmationEmail: canOfferConfirmationEmail ? sendConfirmationEmail : false,
    });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAdvance();
  }

  // ── Loading ────────────────────────────────────────────────────────────

  if (isPending || !receiptCheckDone) {
    return (
      <p className="py-16 text-center dossier-meta text-[var(--color-ink-faded)]">
        RETRIEVING TRANSMISSION PROTOCOL...
      </p>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────

  if (isError || !form) {
    const message =
      error?.data?.code === "NOT_FOUND"
        ? "This transmission terminal does not exist or is no longer active."
        : (error?.message ?? "Unable to load form.");
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <DossierStamp variant="red" rotate={-5} size="sm">
          ACCESS DENIED
        </DossierStamp>
        <p className="mt-6 dossier-body">{message}</p>
      </div>
    );
  }

  // ── Already filed on this device ──────────────────────────────────────

  if (existingSubmissionId && !submitted) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <DossierStamp variant="red" rotate={-5} size="sm">
          DOSSIER ALREADY ON FILE
        </DossierStamp>
        <p className="mt-6 dossier-body">
          Our records indicate you have already filed a report on this terminal from this device.
          Each operative may submit one report per terminal.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={`/f/${slug}/submission/${existingSubmissionId}`}
            className="block w-full max-w-xs border-2 border-[var(--color-ink)] px-5 py-3 text-center dossier-meta text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
          >
            VIEW YOUR FILED REPORT →
          </Link>
          <Link
            href={`/f/${slug}/my-reports`}
            className="dossier-nav text-[var(--color-ink-faded)] hover:text-[var(--color-ink)]"
          >
            ALL MY REPORTS
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <SubmitSuccessScreen
        form={form}
        answers={answers}
        slug={slug}
        submissionId={submissionId}
        emailSent={canOfferConfirmationEmail && sendConfirmationEmail}
      />
    );
  }

  // ── Empty form guard ───────────────────────────────────────────────────

  if (visibleFields.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="dossier-body text-[var(--color-ink-faded)]">
          This dossier contains no directives.
        </p>
      </div>
    );
  }

  // ── Stepped form view ──────────────────────────────────────────────────

  const field = visibleFields[currentStep]!;
  const isLastStep = currentStep === visibleFields.length - 1;
  const today = new Date()
    .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();

  return (
    <form onSubmit={handleFormSubmit} className="relative mx-auto max-w-2xl px-6 py-10 md:px-8">
      {/* ── Header: case metadata ─────────────────────────────────── */}
      <div className="mb-10 border-b-2 border-[var(--color-ink)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="dossier-kicker text-[var(--color-ink-faded)]">
              DIRECTIVE {currentStep + 1} OF {visibleFields.length} — CASE #{slug.toUpperCase()}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-black text-[var(--color-ink)]">
              {form.title}
            </h1>
          </div>
          <Link
            href={`/f/${slug}/my-reports`}
            className="dossier-nav text-[var(--color-ink-faded)] hover:text-[var(--color-stamp)]"
          >
            MY REPORTS →
          </Link>
        </div>

        {/* Progress track */}
        <div className="mt-4 flex gap-1.5">
          {visibleFields.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 transition-colors duration-300"
              style={{
                backgroundColor:
                  i < currentStep
                    ? "var(--color-ink)"
                    : i === currentStep
                      ? "var(--color-manila)"
                      : "var(--color-paper-dark)",
                border: "1px solid var(--color-ink-faded)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── RECORDED stamp overlay ────────────────────────────────── */}
      <AnimatePresence>
        {showRecorded && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <DossierStamp variant="red" rotate={-8} size="lg">
              RECORDED ✓
            </DossierStamp>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Question area with slide transition ───────────────────── */}
      <div className="relative min-h-[280px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="dossier-meta mb-3 text-[var(--color-ink-muted)]">{today} —</p>

            <h2 className="mb-2 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight text-[var(--color-ink)]">
              {field.label}
            </h2>

            {field.required && (
              <p className="mb-5 dossier-meta text-[var(--color-stamp)]">CLASSIFIED — MANDATORY</p>
            )}

            {field.helpText && (
              <p className="mb-6 dossier-body text-[var(--color-ink-faded)]">{field.helpText}</p>
            )}

            <div className="mt-6">
              <FormFieldRenderer
                field={field}
                value={answers[field.id]}
                onChange={(v) => handleChange(field.id, v)}
                showLabel={false}
                emailAutofillHint={field.type === "email" && showAutofillHint}
              />
            </div>

            {/* Validation error stamp */}
            <AnimatePresence>
              {fieldErrors[field.id] && (
                <motion.div
                  className="mt-5 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <DossierStamp variant="red" rotate={-4} size="sm">
                    INSUFFICIENT INFORMATION
                  </DossierStamp>
                  <p className="dossier-meta text-[var(--color-stamp)]">
                    ✗ {fieldErrors[field.id]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Email confirmation opt-in (last step only) ───────── */}
            {showEmailToggle(isLastStep) && (
              <div className="mt-8 border-t border-dotted border-[var(--color-ink-faded)] pt-5">
                <DossierToggle
                  checked={sendConfirmationEmail}
                  onChange={setSendConfirmationEmail}
                  label="DISPATCH CONFIRMATION COPY"
                  offLabel="NO"
                  onLabel="YES"
                  description={
                    session?.user?.email
                      ? `Send a copy of your responses to ${session.user.email}.`
                      : "Send a copy of your responses to your account email."
                  }
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <div className="mt-10 flex items-center gap-6">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="dossier-meta border-b border-dotted border-[var(--color-ink-faded)] text-[var(--color-ink-faded)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
          >
            ← PREVIOUS DIRECTIVE
          </button>
        )}
        <div className="ml-auto min-w-[240px]">
          <DossierButton
            type="submit"
            isSubmitting={isLastStep && submitMutation.isPending}
            submittingText="TRANSMITTING TO HQ..."
          >
            {isLastStep
              ? (form.submitButtonText ?? "TRANSMIT TO HQ")
              : "PROCEED TO NEXT DIRECTIVE →"}
          </DossierButton>
        </div>
      </div>

      {field.type !== "long_text" && (
        <p className="mt-3 text-right dossier-caption text-[var(--color-ink-muted)]">
          press ENTER to advance
        </p>
      )}
    </form>
  );
}
