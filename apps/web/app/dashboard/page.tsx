"use client";

import { signOut, useSession } from "@repo/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { DossierConfirmDialog } from "~/components/dossier/confirm-dialog";
import { DossierNavButton, DossierNavLink } from "~/components/dossier/nav-link";
import { DossierStamp } from "~/components/dossier/stamp";
import { DossierPageShell } from "~/components/dossier/page-shell";
import { Spinner } from "~/components/ui/spinner";
import { trpc } from "~/trpc/client";

const TICKER_ITEMS = [
  "INTELLIGENCE OVERVIEW — OPERATIVE TERMINAL ACTIVE",
  "CASE FILES INDEXED AND AVAILABLE FOR REVIEW",
  "ALL TRANSMISSIONS LOGGED AND VERIFIED",
  "FIELD REPORTS AWAITING HANDLER REVIEW",
];

// Map form status to stamp display config
const STATUS_CONFIG = {
  draft: { label: "DRAFT — PENDING", variant: "brass" as const, rotate: -4 },
  published_public: { label: "PUBLISHED — PUBLIC", variant: "ink" as const, rotate: 3 },
  published_unlisted: { label: "PUBLISHED — UNLISTED", variant: "ink" as const, rotate: -3 },
} as const;

type FormStatus = keyof typeof STATUS_CONFIG;

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: formsData, isPending: formsPending } = trpc.form.list.useQuery(undefined, {
    enabled: !!session,
  });
  const { data: planUsage } = trpc.billing.usage.useQuery(undefined, {
    enabled: !!session,
  });

  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace("/sign-in");
    }
  }, [sessionPending, session, router]);

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  if (sessionPending || !session) {
    return (
      <div className="dossier-theme flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
        <div className="text-center">
          <Spinner className="mx-auto size-6 text-[var(--color-ink)]" />
          <p className="dossier-meta mt-3">VERIFYING CREDENTIALS...</p>
        </div>
      </div>
    );
  }

  const forms = formsData ?? [];
  const totalReports = forms.reduce((sum, f) => sum + f.responseCount, 0);
  const user = session.user;
  const canCreateForm = planUsage?.canCreateForm ?? true;
  const formLimitLabel = planUsage
    ? `${planUsage.usage.activeForms} / ${planUsage.limits.maxForms} dossiers`
    : null;

  return (
    <DossierPageShell tickerItems={TICKER_ITEMS} classification="EYES ONLY">
      {/* Page header row */}
      <div className="flex items-center justify-between border-b-2 border-[var(--color-ink)] px-6 py-4 md:px-10">
        <div>
          <p className="dossier-meta">OPERATIVE: {user.name ?? user.email}</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-black text-[var(--color-ink)] md:text-3xl">
            INTELLIGENCE OVERVIEW
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
          <DossierNavLink href="/explore" variant="secondary">
            PUBLIC TERMINAL
          </DossierNavLink>
          <DossierNavLink href="/pricing" variant="accent">
            PRICING
          </DossierNavLink>
          <DossierNavButton variant="ghost" onClick={() => void handleSignOut()}>
            DEACTIVATE SESSION
          </DossierNavButton>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 border-b-2 border-[var(--color-ink)]">
        {[
          { label: "ACTIVE DOSSIERS", value: forms.length.toString().padStart(4, "0") },
          {
            label: "PUBLISHED FILES",
            value: forms
              .filter((f) => f.status === "published_public" || f.status === "published_unlisted")
              .length.toString()
              .padStart(4, "0"),
          },
          {
            label: "TOTAL REPORTS",
            value: totalReports.toString().padStart(4, "0"),
          },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            className={`px-6 py-4 md:px-10 ${i > 0 ? "border-l-2 border-[var(--color-ink)]" : ""}`}
          >
            <p className="dossier-label">{label}</p>
            <p className="font-[family-name:var(--font-playfair)] text-3xl font-black tabular-nums text-[var(--color-ink)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="px-6 py-8 md:px-10">
        {/* Section header with Create button */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-[var(--color-ink)] pb-3">
          <div>
            <p className="dossier-section-title">CASE FILE INDEX</p>
            {formLimitLabel ? (
              <p className="mt-1 dossier-meta text-xs text-[var(--color-ink-faded)]">
                Clearance usage: {formLimitLabel}
              </p>
            ) : null}
          </div>
          {canCreateForm ? (
            <Link
              href="/forms/new"
              className="dossier-btn border-2 border-[var(--color-ink)] bg-[var(--color-ink)] px-4 py-2 text-[var(--color-paper)] transition-colors hover:bg-[var(--color-stamp)] hover:border-[var(--color-stamp)]"
            >
              + OPEN NEW DOSSIER
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="dossier-btn border-2 border-[var(--color-stamp)] px-4 py-2 text-[var(--color-stamp)] transition-colors hover:bg-[var(--color-stamp)] hover:text-[var(--color-paper)]"
            >
              UPGRADE CLEARANCE
            </Link>
          )}
        </div>

        {/* Form list */}
        {formsPending ? (
          <div className="flex items-center gap-3 py-12">
            <Spinner className="size-5 text-[var(--color-ink)]" />
            <p className="dossier-meta">RETRIEVING CASE FILES...</p>
          </div>
        ) : forms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y-2 divide-[var(--color-ink)] border-2 border-[var(--color-ink)]">
            {forms.map((form, i) => (
              <FormRow key={form.id} form={form} index={i + 1} />
            ))}
          </div>
        )}
      </div>
    </DossierPageShell>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

type FormShape = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  slug: string;
  responseCount: number;
  fieldCount: number;
  createdAt: Date | string;
};

function FormRowActions({ form }: { form: FormShape }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const publish = trpc.form.publish.useMutation({
    onSuccess: () => {
      void utils.form.list.invalidate();
      toast.success("Dossier published");
    },
    onError: (e) => toast.error(e.message),
  });
  const unpublish = trpc.form.unpublish.useMutation({
    onSuccess: () => {
      void utils.form.list.invalidate();
      toast.success("Returned to draft");
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.form.delete.useMutation({
    onSuccess: () => {
      void utils.form.list.invalidate();
      toast.success("Dossier destroyed");
    },
    onError: (e) => toast.error(e.message),
  });

  const duplicate = trpc.form.duplicate.useMutation({
    onSuccess: (copy) => {
      void utils.form.list.invalidate();
      toast.success("Dossier duplicated");
      router.push(`/forms/${copy.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const isBusy =
    publish.isPending ||
    unpublish.isPending ||
    remove.isPending ||
    duplicate.isPending;

  const isPublished =
    form.status === "published_public" || form.status === "published_unlisted";
  const canPublish = form.fieldCount > 0;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {!isPublished ? (
        <>
          <button
            type="button"
            disabled={isBusy || !canPublish}
            title={canPublish ? undefined : "Add at least one field before publishing"}
            onClick={() =>
              publish.mutate({ id: form.id, status: "published_public" })
            }
            className="dossier-meta text-[var(--color-brass)] hover:text-[var(--color-stamp)] disabled:opacity-50"
          >
            PUBLISH
          </button>
          <button
            type="button"
            disabled={isBusy || !canPublish}
            title={canPublish ? undefined : "Add at least one field before publishing"}
            onClick={() =>
              publish.mutate({ id: form.id, status: "published_unlisted" })
            }
            className="dossier-meta hover:text-[var(--color-ink)] disabled:opacity-50"
          >
            UNLISTED
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => unpublish.mutate({ id: form.id })}
          className="dossier-meta hover:text-[var(--color-stamp)] disabled:opacity-50"
        >
          UNPUBLISH
        </button>
      )}
      <DossierConfirmDialog
        title="DUPLICATE DOSSIER"
        description={`A new draft copy of "${form.title}" will be created with the same directives. You will be taken to the new dossier.`}
        confirmLabel="DUPLICATE"
        cancelLabel="STAND DOWN"
        onConfirm={() => duplicate.mutate({ id: form.id })}
        triggerDisabled={isBusy}
        triggerClassName="dossier-meta text-[var(--color-ink-faded)] hover:text-[var(--color-ink)] disabled:opacity-50"
      >
        DUPLICATE
      </DossierConfirmDialog>
      <DossierConfirmDialog
        title="DESTROY DOSSIER"
        description={`"${form.title}" will be permanently destroyed along with all its directives. This action cannot be undone.`}
        confirmLabel="DESTROY"
        cancelLabel="STAND DOWN"
        destructive
        onConfirm={() => remove.mutate({ id: form.id })}
        triggerDisabled={isBusy}
        triggerClassName="dossier-meta text-[var(--color-stamp)] hover:underline disabled:opacity-50"
      >
        DESTROY
      </DossierConfirmDialog>
    </div>
  );
}

function FormRow({ form, index }: { form: FormShape; index: number }) {
  const statusKey = (form.status in STATUS_CONFIG ? form.status : "draft") as FormStatus;
  const statusCfg = STATUS_CONFIG[statusKey];

  const createdAt = new Date(form.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group flex items-start gap-4 bg-[var(--color-paper)] px-6 py-5 transition-colors hover:bg-[var(--color-paper-dark)]">
      {/* Case number */}
      <span className="dossier-meta min-w-[3rem] pt-1">
        #{index.toString().padStart(4, "0")}
      </span>

      {/* Form details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/forms/${form.id}`}
          className="block font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--color-ink)] leading-snug transition-colors hover:text-[var(--color-stamp)]"
        >
          {form.title}
        </Link>
        {form.description && (
          <p className="dossier-body mt-1 text-sm line-clamp-1">
            {form.description}
          </p>
        )}
        <p className="dossier-meta mt-2">
          FILED: {createdAt.toUpperCase()} · SLUG: /{form.slug} · REPORTS:{" "}
          {form.responseCount.toString().padStart(4, "0")}
        </p>
        <FormRowActions form={form} />
      </div>

      {/* Status stamp */}
      <div className="flex-shrink-0">
        <DossierStamp
          variant={statusCfg.variant}
          rotate={statusCfg.rotate}
          size="xs"
        >
          {statusCfg.label}
        </DossierStamp>
      </div>

      {/* Action links */}
      <div className="flex-shrink-0 flex flex-col gap-1 text-right">
        <Link
          href={`/forms/${form.id}`}
          className="dossier-nav"
        >
          EDIT →
        </Link>
        <Link
          href={`/forms/${form.id}/analytics`}
          className="dossier-nav"
        >
          INTEL →
        </Link>
        <Link
          href={`/forms/${form.id}/responses`}
          className="dossier-nav"
        >
          REPORTS →
        </Link>
        {(form.status === "published_public" || form.status === "published_unlisted") && (
          <Link
            href={`/f/${form.slug}`}
            target="_blank"
            className="dossier-nav text-[var(--color-brass)] hover:text-[var(--color-stamp)]"
          >
            VIEW ↗
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-ink-faded)] py-20 text-center"
      style={{ backgroundColor: "var(--color-paper-dark)" }}
    >
      <p className="font-[family-name:var(--font-playfair)] text-3xl font-black text-[var(--color-ink-faded)]">
        NO CASE FILES ON RECORD
      </p>
      <p className="dossier-body mt-3 text-sm">
        No intelligence dossiers have been filed by this operative.
      </p>
      <div className="mt-6">
        <DossierStamp variant="red" rotate={-3} size="sm">
          ARCHIVE EMPTY
        </DossierStamp>
      </div>
      <Link
        href="/forms/new"
        className="dossier-btn mt-8 border-2 border-[var(--color-ink)] bg-[var(--color-ink)] px-6 py-3 text-[var(--color-paper)] transition-colors hover:bg-[var(--color-stamp)] hover:border-[var(--color-stamp)]"
      >
        + OPEN FIRST DOSSIER
      </Link>
    </div>
  );
}
