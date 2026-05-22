"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { RouterOutputs } from "@repo/trpc/client";
import { FIELD_TYPE_CATALOG } from "~/lib/form-types";
import { cn } from "~/lib/utils";

type Field = RouterOutputs["form"]["getById"]["fields"][number];

type SortableFieldListProps = {
  fields: Field[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: { id: string; sortOrder: number }[]) => void;
  onDelete: (id: string) => void;
};

function SortableFieldRow({
  field,
  selected,
  onSelect,
  onDelete,
}: {
  field: Field;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeLabel =
    FIELD_TYPE_CATALOG.find((t) => t.type === field.type)?.label ?? field.type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 border-2 bg-[var(--color-paper)] px-3 py-3 transition-colors",
        selected ? "border-[var(--color-stamp)]" : "border-[var(--color-ink-faded)]",
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        className="cursor-grab text-[var(--color-ink-faded)] hover:text-[var(--color-ink)] active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Reorder field"
      >
        <GripVertical className="size-4" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <p className="truncate font-[family-name:var(--font-playfair)] text-base font-bold text-[var(--color-ink)]">
          {field.label}
        </p>
        <p className="dossier-meta text-[var(--color-ink-faded)]">
          {typeLabel}
          {field.required ? " · MANDATORY" : ""}
          {field.visibilityConfig?.rules?.length ? (
            <span className="text-[var(--color-stamp)]"> · CONDITIONAL</span>
          ) : null}
        </p>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-[var(--color-ink-faded)] hover:text-[var(--color-stamp)]"
        aria-label="Delete field"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function SortableFieldList({
  fields,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
}: SortableFieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    onReorder(reordered.map((f, i) => ({ id: f.id, sortOrder: i })));
  }

  if (fields.length === 0) {
    return (
      <p className="border border-dashed border-[var(--color-ink-faded)] py-12 text-center dossier-body">
        No directives filed. Add field types from the left panel.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {fields.map((field) => (
            <SortableFieldRow
              key={field.id}
              field={field}
              selected={selectedId === field.id}
              onSelect={() => onSelect(field.id)}
              onDelete={() => onDelete(field.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
