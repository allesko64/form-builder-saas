"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { FormFieldType } from "@repo/types";
import type { RouterOutputs } from "@repo/trpc/client";

import { DossierConfirmDialog } from "~/components/dossier/confirm-dialog";
import { DossierStamp } from "~/components/dossier/stamp";
import { Spinner } from "~/components/ui/spinner";
import { FIELD_TYPE_CATALOG, defaultValidationConfig } from "~/lib/form-types";
import { useOptimisticFormEditor } from "~/lib/form-editor/use-optimistic-form-editor";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";

import { FieldConfigPanel } from "./field-config-panel";
import { FieldPalette } from "./field-palette";
import { FormPreview } from "./form-preview";
import { FormSettingsPanel } from "./form-settings-panel";
import { PublishPanel } from "./publish-panel";
import { SortableFieldList } from "./sortable-field-list";

type Form = RouterOutputs["form"]["getById"];
type EditorTab = "build" | "preview";
type RightPanel = "field" | "settings" | "publish";

/** Top-level modes only — form settings & publish live in the inspector panel. */
const MAIN_TABS: { id: EditorTab; label: string }[] = [
  { id: "build", label: "ARCHITECT" },
  { id: "preview", label: "PREVIEW" },
];

const PANEL_TABS: { id: RightPanel; label: string }[] = [
  { id: "field", label: "FIELD" },
  { id: "settings", label: "DOSSIER" },
  { id: "publish", label: "PUBLISH" },
];

const mainTabBtn =
  "border-2 px-4 py-2 font-[family-name:var(--font-courier)] text-xs font-bold uppercase tracking-widest transition-all duration-150";

const panelTabBtn =
  "min-w-[7.5rem] border-2 px-6 py-3 font-[family-name:var(--font-courier)] text-sm font-bold uppercase tracking-widest transition-all duration-150";

type FormEditorProps = {
  formId: string;
};

type CanvasNotice = "filed" | "removed";

export function FormEditor({ formId }: FormEditorProps) {
  const utils = trpc.useUtils();
  const editor = useOptimisticFormEditor(formId);

  const [tab, setTab] = useState<EditorTab>("build");
  const [rightPanel, setRightPanel] = useState<RightPanel>("field");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});
  // Controlled confirm dialog: holds the field id pending deletion
  const [pendingDeleteFieldId, setPendingDeleteFieldId] = useState<string | null>(null);
  const [canvasNotice, setCanvasNotice] = useState<CanvasNotice | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: form, isPending, isError } = trpc.form.getById.useQuery(
    { id: formId },
    { enabled: !!formId },
  );

  const invalidate = useCallback(() => {
    void utils.form.getById.invalidate({ id: formId });
    void utils.form.list.invalidate();
  }, [formId, utils]);

  const flashCanvasNotice = useCallback((notice: CanvasNotice) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setCanvasNotice(notice);
    noticeTimerRef.current = setTimeout(() => {
      setCanvasNotice(null);
      noticeTimerRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const createField = trpc.field.create.useMutation({
    onSuccess: (field) => {
      invalidate();
      setSelectedFieldId(field.id);
      setRightPanel("field");
      flashCanvasNotice("filed");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteField = trpc.field.delete.useMutation({
    onSuccess: () => {
      invalidate();
      setSelectedFieldId(null);
      flashCanvasNotice("removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const reorderFields = trpc.field.reorder.useMutation({
    onSuccess: (data) => {
      utils.form.getById.setData({ id: formId }, (prev) => {
        if (!prev) return prev;
        return { ...prev, fields: data };
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const publishForm = trpc.form.publish.useMutation({
    onSuccess: (updated) => {
      utils.form.getById.setData({ id: formId }, (prev) =>
        prev ? { ...prev, ...updated } : prev,
      );
      editor.invalidateList();
      toast.success("Dossier published");
    },
    onError: (e) => toast.error(e.message),
  });

  const unpublishForm = trpc.form.unpublish.useMutation({
    onSuccess: (updated) => {
      utils.form.getById.setData({ id: formId }, (prev) =>
        prev ? { ...prev, ...updated } : prev,
      );
      editor.invalidateList();
      toast.success("Dossier returned to draft");
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedField = useMemo(() => {
    if (!form || !selectedFieldId) return null;
    return form.fields.find((f) => f.id === selectedFieldId) ?? null;
  }, [form, selectedFieldId]);

  function handleAddField(type: FormFieldType) {
    const meta = FIELD_TYPE_CATALOG.find((t) => t.type === type);
    createField.mutate({
      formId,
      type,
      label: meta?.defaultLabel ?? "New field",
      validationConfig: defaultValidationConfig(type),
      placeholder:
        type === "checkbox" ? "I confirm the above is accurate" : null,
    });
  }

  function handleTabChange(next: EditorTab) {
    setTab(next);
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-3 px-6 py-16 md:px-10">
        <Spinner className="size-5 text-[var(--color-ink)]" />
        <p className="dossier-meta text-[var(--color-ink-faded)]">
          LOADING CASE FILE...
        </p>
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="px-6 py-16 md:px-10">
        <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-ink)]">
          CASE FILE NOT FOUND
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block dossier-nav text-[var(--color-stamp)]"
        >
          ← RETURN TO OVERVIEW
        </Link>
      </div>
    );
  }

  const sortedFields = [...form.fields].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasDirectives = sortedFields.length > 0;

  function handlePublish(status: "published_public" | "published_unlisted") {
    if (!hasDirectives) return;
    publishForm.mutate({ id: form!.id, status });
  }

  const isMutating =
    createField.isPending ||
    editor.isSyncing ||
    deleteField.isPending ||
    reorderFields.isPending;

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="border-b-2 border-[var(--color-ink)] px-6 py-4 md:px-10">
        <Link
          href="/dashboard"
          className="dossier-nav text-[var(--color-ink-faded)] hover:text-[var(--color-ink)]"
        >
          ← INTELLIGENCE OVERVIEW
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dossier-kicker text-[var(--color-ink-faded)]">
              CASE #{form.id.slice(0, 8).toUpperCase()}
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-black text-[var(--color-ink)] md:text-3xl">
              {form.title}
            </h1>
          </div>
          <DossierStamp variant="brass" rotate={-3} size="xs">
            {form.status.replace(/_/g, " ").toUpperCase()}
          </DossierStamp>
        </div>

        {/* Main editor tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {MAIN_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={cn(
                mainTabBtn,
                tab === id
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] shadow-[3px_3px_0_var(--color-ink-faded)]"
                  : "border-[var(--color-ink-faded)] bg-transparent text-[var(--color-ink-faded)] hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] hover:text-[var(--color-ink)] hover:shadow-[2px_2px_0_var(--color-ink-faded)]",
              )}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-8 w-px bg-[var(--color-ink)] md:block" />
          <Link
            href={`/forms/${form.id}/analytics`}
            className={cn(
              mainTabBtn,
              "inline-flex items-center border-[var(--color-ink-faded)] text-[var(--color-ink-faded)] hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] hover:text-[var(--color-ink)]",
            )}
          >
            INTEL →
          </Link>
          <Link
            href={`/forms/${form.id}/responses`}
            className={cn(
              mainTabBtn,
              "inline-flex items-center border-[var(--color-ink-faded)] text-[var(--color-ink-faded)] hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] hover:text-[var(--color-ink)]",
            )}
          >
            RESPONSES →
          </Link>
        </div>

        {/* Right-panel tabs — build mode only, below main tabs */}
        {tab === "build" ? (
          <div className="mt-4 border-t border-dotted border-[var(--color-ink-faded)] pt-4">
            <p className="mb-3 dossier-caption text-[var(--color-ink-muted)]">
              INSPECTOR — configure fields, dossier settings, or publish
            </p>
            <div className="flex flex-wrap gap-2">
              {PANEL_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRightPanel(id)}
                  className={cn(
                    panelTabBtn,
                    rightPanel === id
                      ? "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper)] shadow-[4px_4px_0_var(--color-stamp-faded)]"
                      : "border-[var(--color-ink)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-stamp)] hover:bg-[var(--color-paper-dark)] hover:shadow-[3px_3px_0_var(--color-ink-faded)] active:translate-x-px active:translate-y-px active:shadow-none",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Body */}
      {tab === "preview" ? (
        <div className="px-6 py-8 md:px-10">
          <FormPreview
            form={form}
            previewValues={previewValues}
            onPreviewChange={(fieldId, value) =>
              setPreviewValues((prev) => ({ ...prev, [fieldId]: value }))
            }
          />
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[220px_1fr_300px] xl:grid-cols-[240px_1fr_320px]">
          <aside className="border-b-2 border-[var(--color-ink)] px-4 py-6 lg:border-b-0 lg:border-r-2">
            <FieldPalette
              onAddAction={handleAddField}
              disabled={createField.isPending}
            />
          </aside>

          <section className="relative px-4 py-6 md:px-6">
            <p className="mb-4 dossier-kicker text-[var(--color-ink)]">
              DIRECTIVE CANVAS
            </p>

            <AnimatePresence>
              {canvasNotice && (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 1.35 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DossierStamp
                    variant={canvasNotice === "filed" ? "brass" : "red"}
                    rotate={canvasNotice === "filed" ? -6 : 5}
                    size="lg"
                  >
                    {canvasNotice === "filed"
                      ? "DIRECTIVE FILED"
                      : "DIRECTIVE REMOVED"}
                  </DossierStamp>
                </motion.div>
              )}
            </AnimatePresence>

            <SortableFieldList
              fields={sortedFields}
              selectedId={selectedFieldId}
              onSelect={(id) => {
                setSelectedFieldId(id);
                setRightPanel("field");
              }}
              onReorder={(order) => reorderFields.mutate({ formId, order })}
              onDelete={(id) => setPendingDeleteFieldId(id)}
            />
          </section>

          <aside className="border-t-2 border-[var(--color-ink)] px-4 py-6 lg:border-l-2 lg:border-t-0">
              <p className="mb-4 dossier-kicker text-[var(--color-ink-faded)]">
                {rightPanel === "field"
                  ? "FIELD DIRECTIVE"
                  : rightPanel === "settings"
                    ? "DOSSIER SETTINGS"
                    : "PUBLICATION"}
              </p>

              {rightPanel === "field" ? (
                <FieldConfigPanel
                  field={selectedField}
                  allFields={sortedFields}
                  syncRevision={editor.syncRevision}
                  onQueuePatchAction={(patch) => {
                    if (!selectedField) return;
                    editor.queueFieldPatch(selectedField.id, patch);
                  }}
                  onApplyNowAction={(patch) => {
                    if (!selectedField) return;
                    editor.applyFieldPatchNow(selectedField.id, patch);
                  }}
                />
              ) : null}
              {rightPanel === "settings" ? (
                <FormSettingsPanel
                  form={form}
                  syncRevision={editor.syncRevision}
                  onQueuePatchAction={editor.queueFormPatch}
                  onApplyNowAction={editor.applyFormPatchNow}
                />
              ) : null}
              {rightPanel === "publish" ? (
                <PublishPanel
                  form={form}
                  hasDirectives={hasDirectives}
                  isPublishing={
                    publishForm.isPending || unpublishForm.isPending
                  }
                  onPublish={handlePublish}
                  onUnpublish={() => unpublishForm.mutate({ id: form.id })}
                />
              ) : null}

              {isMutating ? (
                <p className="dossier-meta mt-4">SYNCING...</p>
              ) : null}
          </aside>
        </div>
      )}

      {/* ── Controlled confirm dialog for field deletion ─────── */}
      <DossierConfirmDialog
        title="REMOVE DIRECTIVE"
        description="This directive will be permanently removed from the dossier. Any responses already recorded against it will be retained, but new submissions will not include it."
        confirmLabel="REMOVE"
        cancelLabel="STAND DOWN"
        destructive
        open={!!pendingDeleteFieldId}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteFieldId(null);
        }}
        onConfirm={() => {
          if (pendingDeleteFieldId) {
            deleteField.mutate({ id: pendingDeleteFieldId });
            setPendingDeleteFieldId(null);
          }
        }}
      />
    </div>
  );
}
