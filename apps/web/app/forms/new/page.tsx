"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  DossierButton,
  DossierFormMessage,
  DossierFormPanelTitle,
  DossierInput,
  DossierLabel,
} from "~/components/auth/dossier-fields";
import { DossierPageShell } from "~/components/dossier/page-shell";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { trpc } from "~/trpc/client";

const TICKER_ITEMS = [
  "NEW DOSSIER — DOCUMENT ARCHITECT ACTIVE",
  "FIELD OPERATIVE AUTHORIZED TO FILE NEW INTELLIGENCE FORM",
  "CASE FILE INITIALIZATION IN PROGRESS",
];

const createDossierSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
});

type CreateDossierValues = z.infer<typeof createDossierSchema>;

const textareaClassName =
  "w-full min-h-[120px] resize-y rounded-none border border-dotted border-[var(--color-ink-faded)] bg-[color-mix(in_srgb,var(--color-paper-dark)_40%,transparent)] px-3 py-2.5 font-[family-name:var(--font-courier)] text-base text-[var(--color-ink)] placeholder:text-[var(--color-placeholder)] focus:border-2 focus:border-solid focus:border-[var(--color-ink)] focus:bg-[var(--color-paper)] focus:outline-none focus:ring-0";

export default function NewFormPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createForm = trpc.form.create.useMutation({
    onSuccess: (form) => {
      toast.success("Dossier opened");
      router.push(`/forms/${form.id}`);
    },
    onError: (err) => {
      toast.error(err.message ?? "Could not open dossier");
    },
  });

  const form = useForm<CreateDossierValues>({
    resolver: zodResolver(createDossierSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: CreateDossierValues) {
    setIsSubmitting(true);
    try {
      await createForm.mutateAsync({
        title: values.title,
        description: values.description?.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DossierPageShell tickerItems={TICKER_ITEMS} classification="EYES ONLY">
      <div className="mx-auto max-w-xl px-6 py-10 md:px-10 md:py-12">
        <Link
          href="/dashboard"
          className="font-[family-name:var(--font-courier)] text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[var(--color-ink-faded)] transition-colors hover:text-[var(--color-ink)]"
        >
          ← RETURN TO INTELLIGENCE OVERVIEW
        </Link>

        <p className="mt-6 font-[family-name:var(--font-courier)] text-[0.75rem] font-bold uppercase tracking-[0.2em] text-[var(--color-stamp)]">
          DOCUMENT ARCHITECT · NEW CASE FILE
        </p>

        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-black text-[var(--color-ink)]">
          OPEN NEW DOSSIER
        </h1>

        <p className="mt-3 font-[family-name:var(--font-lora)] text-base leading-relaxed text-[var(--color-ink-faded)]">
          Assign a codename and briefing notes. You may add field directives after the file is
          opened.
        </p>

        <div
          className="mt-10 border-2 border-[var(--color-ink)] p-6 md:p-8"
          style={{ backgroundColor: "var(--color-paper-dark)" }}
        >
          <DossierFormPanelTitle>DOSSIER REGISTRATION</DossierFormPanelTitle>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <DossierLabel>DOSSIER CODENAME</DossierLabel>
                    <FormControl>
                      <DossierInput
                        placeholder="e.g. Operation Nightfall Intake"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <DossierFormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <DossierLabel>FIELD BRIEFING (OPTIONAL)</DossierLabel>
                    <FormControl>
                      <textarea
                        className={textareaClassName}
                        placeholder="Purpose of this intelligence collection..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <DossierFormMessage />
                  </FormItem>
                )}
              />

              <DossierButton
                type="submit"
                isSubmitting={isSubmitting || createForm.isPending}
                submittingText="OPENING DOSSIER..."
              >
                OPEN DOSSIER
              </DossierButton>
            </form>
          </Form>
        </div>
      </div>
    </DossierPageShell>
  );
}
