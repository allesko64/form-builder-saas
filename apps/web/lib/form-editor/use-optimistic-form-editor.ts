"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { RouterOutputs } from "@repo/trpc/client";

import { useDebouncedCallback } from "~/lib/use-debounced-callback";
import { trpc } from "~/trpc/client";

import {
  type EditorForm,
  type FieldPatch,
  type FormPatch,
  patchFormData,
  patchFormFields,
} from "./optimistic-form-cache";

const CACHE_DEBOUNCE_MS = 80;
const PERSIST_DEBOUNCE_MS = 450;

export function useOptimisticFormEditor(formId: string
  
) {
  const utils = trpc.useUtils();
  const [syncRevision, setSyncRevision] = useState(0);
  const rollbackSnapshotRef = useRef<EditorForm | null>(null);
  const pendingFieldPatchesRef = useRef<Map<string, FieldPatch>>(new Map());
  const pendingFormPatchRef = useRef<FormPatch>({});

  const takeSnapshot = useCallback(() => {
    rollbackSnapshotRef.current =
      utils.form.getById.getData({ id: formId }) ?? null;
  }, [formId, utils]);

  const rollback = useCallback(() => {
    if (rollbackSnapshotRef.current) {
      utils.form.getById.setData({ id: formId }, rollbackSnapshotRef.current);
    } else {
      void utils.form.getById.invalidate({ id: formId });
    }
    rollbackSnapshotRef.current = null;
    setSyncRevision((n) => n + 1);
  }, [formId, utils]);

  const patchFieldCache = useCallback(
    (fieldId: string, patch: FieldPatch) => {
      utils.form.getById.setData({ id: formId }, (prev) => {
        if (!prev) return prev;
        return patchFormFields(prev, fieldId, patch);
      });
    },
    [formId, utils],
  );

  const patchFormCache = useCallback(
    (patch: FormPatch) => {
      utils.form.getById.setData({ id: formId }, (prev) => {
        if (!prev) return prev;
        return patchFormData(prev, patch);
      });
    },
    [formId, utils],
  );

  const replaceFieldInCache = useCallback(
    (field: RouterOutputs["form"]["getById"]["fields"][number]) => {
      utils.form.getById.setData({ id: formId }, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fields: prev.fields.map((f) => (f.id === field.id ? field : f)),
        };
      });
    },
    [formId, utils],
  );

  const updateField = trpc.field.update.useMutation({
    onMutate: takeSnapshot,
    onSuccess: (field) => {
      replaceFieldInCache(field);
      rollbackSnapshotRef.current = null;
    },
    onError: (e) => {
      rollback();
      toast.error(e.message);
    },
  });

  const updateForm = trpc.form.update.useMutation({
    onMutate: takeSnapshot,
    onSuccess: (form) => {
      utils.form.getById.setData({ id: formId }, (prev) => {
        if (!prev) return prev;
        return { ...prev, ...form };
      });
      void utils.form.list.invalidate();
      rollbackSnapshotRef.current = null;
    },
    onError: (e) => {
      rollback();
      toast.error(e.message);
    },
  });

  const flushFieldPersist = useCallback(
    (fieldId: string) => {
      const patch = pendingFieldPatchesRef.current.get(fieldId);
      if (!patch || Object.keys(patch).length === 0) return;
      pendingFieldPatchesRef.current.delete(fieldId);
      updateField.mutate({ id: fieldId, ...patch });
    },
    [updateField],
  );

  const flushFormPersist = useCallback(() => {
    const patch = pendingFormPatchRef.current;
    if (Object.keys(patch).length === 0) return;
    pendingFormPatchRef.current = {};
    updateForm.mutate({ id: formId, ...patch });
  }, [formId, updateForm]);

  const debouncedPatchFieldCache = useDebouncedCallback(
    (fieldId: string, patch: FieldPatch) => {
      patchFieldCache(fieldId, patch);
    },
    CACHE_DEBOUNCE_MS,
  );

  const debouncedPersistField = useDebouncedCallback((fieldId: string) => {
    flushFieldPersist(fieldId);
  }, PERSIST_DEBOUNCE_MS);

  const debouncedPatchFormCache = useDebouncedCallback((patch: FormPatch) => {
    patchFormCache(patch);
  }, CACHE_DEBOUNCE_MS);

  const debouncedPersistForm = useDebouncedCallback(() => {
    flushFormPersist();
  }, PERSIST_DEBOUNCE_MS);

  const queueFieldPatch = useCallback(
    (fieldId: string, patch: FieldPatch) => {
      const prev = pendingFieldPatchesRef.current.get(fieldId) ?? {};
      const merged: FieldPatch = { ...prev, ...patch };
      if (patch.validationConfig !== undefined) {
        merged.validationConfig = {
          ...(prev.validationConfig ?? {}),
          ...patch.validationConfig,
        };
      }
      pendingFieldPatchesRef.current.set(fieldId, merged);
      debouncedPatchFieldCache(fieldId, merged);
      debouncedPersistField(fieldId);
    },
    [debouncedPatchFieldCache, debouncedPersistField],
  );

  const queueFormPatch = useCallback(
    (patch: FormPatch) => {
      pendingFormPatchRef.current = {
        ...pendingFormPatchRef.current,
        ...patch,
      };
      debouncedPatchFormCache(pendingFormPatchRef.current);
      debouncedPersistForm();
    },
    [debouncedPatchFormCache, debouncedPersistForm],
  );

  /** Immediate cache + persist (checkboxes, theme, etc.) */
  const applyFieldPatchNow = useCallback(
    (fieldId: string, patch: FieldPatch) => {
      patchFieldCache(fieldId, patch);
      pendingFieldPatchesRef.current.delete(fieldId);
      updateField.mutate({ id: fieldId, ...patch });
    },
    [patchFieldCache, updateField],
  );

  const applyFormPatchNow = useCallback(
    (patch: FormPatch) => {
      patchFormCache(patch);
      pendingFormPatchRef.current = {};
      updateForm.mutate({ id: formId, ...patch });
    },
    [formId, patchFormCache, updateForm],
  );

  const invalidateList = useCallback(() => {
    void utils.form.list.invalidate();
  }, [utils]);

  return {
    syncRevision,
    queueFieldPatch,
    queueFormPatch,
    applyFieldPatchNow,
    applyFormPatchNow,
    patchFieldCache,
    patchFormCache,
    rollback,
    updateField,
    updateForm,
    invalidateList,
    isSyncing: updateField.isPending || updateForm.isPending,
  };
}
