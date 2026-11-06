'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, GripVertical } from 'lucide-react';

interface Props<T extends { id: string }> {
  items: T[];
  // Receives the full new order of ids after a drop.
  onReorder: (ids: string[]) => void;
  // "list" stacks rows, "wrap" flows items like chips.
  layout?: 'list' | 'wrap';
  // Spoken to screen readers and used as the handle's label.
  label: (item: T) => string;
  // `handle` is the grip button; place it wherever it belongs in the row. Only the handle
  // starts a drag, so the other buttons in the row keep working.
  renderItem: (item: T, handle: ReactNode) => ReactNode;
}

export const moveClass =
  'flex size-6 shrink-0 items-center justify-center rounded text-muted hover:text-ink disabled:opacity-30';

function Row({
  id,
  label,
  layout,
  index,
  count,
  onMove,
  children,
}: {
  id: string;
  label: string;
  layout: 'list' | 'wrap';
  index: number;
  count: number;
  onMove: (id: string, direction: -1 | 1) => void;
  children: (handle: ReactNode) => ReactNode;
}) {
  // Dragging is not possible for everyone, so every row also has plain buttons (one click each).
  const [before, after] = layout === 'wrap' ? ['earlier', 'later'] : ['up', 'down'];
  const arrow = (later: boolean) => {
    const Icon =
      layout === 'wrap' ? (later ? ChevronRight : ChevronLeft) : later ? ChevronDown : ChevronUp;
    return <Icon aria-hidden="true" className="size-4" />;
  };
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const handle = (
    <span className="inline-flex shrink-0 items-center">
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`Reorder ${label}`}
        title="Drag to reorder"
        className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded-control border border-line p-1.5 text-muted hover:bg-surface hover:text-ink active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-5" />
      </button>
      <button
        type="button"
        data-move={`${id}:-1`}
        disabled={index === 0}
        aria-label={`Move ${label} ${before}`}
        onClick={() => onMove(id, -1)}
        className={moveClass}
      >
        {arrow(false)}
      </button>
      <button
        type="button"
        data-move={`${id}:1`}
        disabled={index === count - 1}
        aria-label={`Move ${label} ${after}`}
        onClick={() => onMove(id, 1)}
        className={moveClass}
      >
        {arrow(true)}
      </button>
    </span>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`${layout === 'wrap' ? '' : 'w-full'} ${isDragging ? 'relative z-10 opacity-80 shadow-overlay' : ''}`}
    >
      {children(handle)}
    </li>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  layout = 'list',
  label,
  renderItem,
}: Props<T>) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map((item) => item.id);
  const nameOf = (id: UniqueIdentifier) => {
    const item = items.find((it) => it.id === id);
    return item ? label(item) : 'item';
  };
  const position = (id: UniqueIdentifier) => `${ids.indexOf(String(id)) + 1} of ${ids.length}`;

  // The buttons' alternative to dragging. The row keeps its button's focus after it moves, and the
  // new position is spoken.
  const list = useRef<HTMLUListElement>(null);
  const refocus = useRef<string | null>(null);
  const [moved, setMoved] = useState('');
  function onMove(id: string, direction: -1 | 1) {
    const from = ids.indexOf(id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    refocus.current = `${id}:${direction}`;
    setMoved(`${nameOf(id)} moved to position ${to + 1} of ${ids.length}.`);
    onReorder(arrayMove(ids, from, to));
  }
  useEffect(() => {
    if (!refocus.current) return;
    const [id, direction] = refocus.current.split(':');
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>(`[data-move^="${id}:"]`);
    // At the end of the list the pressed button is disabled; the other one takes the focus.
    const target =
      [...(buttons ?? [])].find((b) => !b.disabled && b.dataset.move === refocus.current) ??
      [...(buttons ?? [])].find((b) => !b.disabled && !b.dataset.move?.endsWith(`:${direction}`));
    target?.focus();
    refocus.current = null;
  });

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        // The defaults would read out raw database ids.
        announcements: {
          onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
          onDragOver: ({ active, over }) =>
            over ? `${nameOf(active.id)} is at position ${position(over.id)}.` : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? `${nameOf(active.id)} dropped at position ${position(over.id)}.`
              : `${nameOf(active.id)} dropped.`,
          onDragCancel: ({ active }) => `Cancelled. ${nameOf(active.id)} did not move.`,
        },
      }}
    >
      <SortableContext
        items={ids}
        strategy={layout === 'wrap' ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <ul ref={list} className={layout === 'wrap' ? 'flex flex-wrap gap-2' : 'space-y-3'}>
          {items.map((item, index) => (
            <Row
              key={item.id}
              id={item.id}
              label={label(item)}
              layout={layout}
              index={index}
              count={items.length}
              onMove={onMove}
            >
              {(handle) => renderItem(item, handle)}
            </Row>
          ))}
        </ul>
        <p role="status" className="sr-only">
          {moved}
        </p>
      </SortableContext>
    </DndContext>
  );
}
