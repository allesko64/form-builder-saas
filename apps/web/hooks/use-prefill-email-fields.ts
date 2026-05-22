"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

import { prefillEmptyEmailFields, type EmailFieldLike } from "~/lib/forms/prefill-email-fields";

export function usePrefillEmailFields(
  formId: string | undefined,
  fields: EmailFieldLike[] | undefined,
  accountEmail: string | undefined,
  updateAnswers: Dispatch<SetStateAction<Record<string, unknown>>>,
): { showAutofillHint: boolean } {
  const prefilledForFormRef = useRef<string | null>(null);

  useEffect(() => {
    if (!formId || !accountEmail || !fields?.length) return;
    if (prefilledForFormRef.current === formId) return;
    prefilledForFormRef.current = formId;

    updateAnswers((prev) => {
      const next = prefillEmptyEmailFields(fields, prev, accountEmail);
      return next ?? prev;
    });
  }, [formId, fields, accountEmail, updateAnswers]);

  return { showAutofillHint: Boolean(accountEmail) };
}
