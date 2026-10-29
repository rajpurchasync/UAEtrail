import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import type { PackingAckMode, PackingItem } from '@uaetrail/shared-types';
import {
  defaultHikingPackingItems,
  placePackingItem,
} from '@uaetrail/shared-types';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { exploreFlowChoiceCardClass } from './exploreFlowUi';
import {
  PACKING_DEFAULTS_CTA,
  PACKING_LIST_TITLE,
  PACKING_MODE_LENIENT_SUBTITLE,
  PACKING_MODE_LENIENT_TITLE,
  PACKING_MODE_STRICT_SUBTITLE,
  PACKING_MODE_STRICT_TITLE,
  PACKING_MUST_LABEL,
  PACKING_NICE_LABEL,
  packingChipClassName,
} from '../createFlowCopy';

type HostingPackingListEditorProps = {
  mode: PackingAckMode;
  items: PackingItem[];
  defaultMode?: PackingAckMode;
  onChange: (patch: { packingAckMode?: PackingAckMode; packingItems?: PackingItem[] }) => void;
};

type DragState = {
  id: string;
  item: PackingItem;
  x: number;
  y: number;
  grabX: number;
  grabY: number;
  width: number;
  height: number;
  dropRequired: boolean;
  dropIndex: number;
};

const slugId = (label: string): string =>
  `custom-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || Date.now()}`;

const resolveDrop = (
  clientX: number,
  clientY: number,
  dragId: string,
  mustRoot: HTMLElement | null,
  niceRoot: HTMLElement | null
): { dropRequired: boolean; dropIndex: number } | null => {
  const sections: { required: boolean; el: HTMLElement }[] = [];
  if (mustRoot) sections.push({ required: true, el: mustRoot });
  if (niceRoot) sections.push({ required: false, el: niceRoot });
  if (sections.length === 0) return null;

  const hit =
    sections.find((section) => {
      const rect = section.el.getBoundingClientRect();
      return clientY >= rect.top - 12 && clientY <= rect.bottom + 12 && clientX >= rect.left - 24 && clientX <= rect.right + 24;
    }) ??
    sections.reduce((closest, section) => {
      const mid = section.el.getBoundingClientRect().top + section.el.getBoundingClientRect().height / 2;
      const closestMid =
        closest.el.getBoundingClientRect().top + closest.el.getBoundingClientRect().height / 2;
      return Math.abs(clientY - mid) < Math.abs(clientY - closestMid) ? section : closest;
    });

  const rows = [...hit.el.querySelectorAll<HTMLElement>('[data-packing-id]')].filter(
    (row) => row.dataset.packingId !== dragId
  );
  if (rows.length === 0) return { dropRequired: hit.required, dropIndex: 0 };
  for (let index = 0; index < rows.length; index += 1) {
    const rect = rows[index].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return { dropRequired: hit.required, dropIndex: index };
    }
  }
  return { dropRequired: hit.required, dropIndex: rows.length };
};

export const HostingPackingListEditor = ({
  mode,
  items: packingItems,
  defaultMode = 'strict',
  onChange,
}: HostingPackingListEditorProps) => {
  const items = packingItems ?? [];
  const [draftLabel, setDraftLabel] = useState('');
  const [draftEmoji, setDraftEmoji] = useState('✅');
  const [draftRequired, setDraftRequired] = useState(true);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const itemsRef = useRef(items);
  const mustRootRef = useRef<HTMLDivElement | null>(null);
  const niceRootRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);

  itemsRef.current = items;
  onChangeRef.current = onChange;

  const must = items.filter((item) => item.required && item.id !== drag?.id);
  const nice = items.filter((item) => !item.required && item.id !== drag?.id);

  const setRequired = (id: string, required: boolean) => {
    const group = items.filter((item) => item.required === required && item.id !== id);
    onChange({ packingItems: placePackingItem(items, id, required, group.length) });
  };

  const removeItem = (id: string) => {
    onChange({ packingItems: items.filter((item) => item.id !== id) });
  };

  const moveItem = (id: string, required: boolean, toIndex: number) => {
    onChange({ packingItems: placePackingItem(items, id, required, toIndex) });
  };

  const stopDragListenersRef = useRef<(() => void) | null>(null);

  const finishDrag = useCallback(() => {
    stopDragListenersRef.current?.();
    stopDragListenersRef.current = null;
    const current = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    if (!current) return;
    onChangeRef.current({
      packingItems: placePackingItem(
        itemsRef.current,
        current.id,
        current.dropRequired,
        current.dropIndex
      ),
    });
  }, []);

  const beginDrag = (event: ReactPointerEvent, item: PackingItem) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const row = (event.currentTarget as HTMLElement).closest('[data-packing-id]');
    if (!(row instanceof HTMLElement)) return;
    const rect = row.getBoundingClientRect();
    const sourceGroup = item.required ? must : nice;
    const next: DragState = {
      id: item.id,
      item,
      x: event.clientX,
      y: event.clientY,
      grabX: event.clientX - rect.left,
      grabY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      dropRequired: item.required,
      dropIndex: Math.max(
        0,
        sourceGroup.findIndex((rowItem) => rowItem.id === item.id)
      ),
    };
    dragRef.current = next;
    setDrag(next);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    const onMove = (moveEvent: PointerEvent | MouseEvent) => {
      moveEvent.preventDefault();
      updateDragFromPointer(moveEvent.clientX, moveEvent.clientY);
    };
    const onUp = () => finishDrag();
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') finishDrag();
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    stopDragListenersRef.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  };

  const addItem = () => {
    const label = draftLabel.trim();
    if (!label) return;
    let id = slugId(label);
    if (items.some((item) => item.label.toLowerCase() === label.toLowerCase())) {
      setDraftLabel('');
      return;
    }
    if (items.some((item) => item.id === id)) {
      id = `${id}-${Date.now().toString(36)}`;
    }
    onChange({
      packingItems: [...items, { id, label, emoji: draftEmoji.trim() || '•', required: draftRequired }],
    });
    setDraftLabel('');
  };

  const updateDragFromPointer = useCallback((clientX: number, clientY: number) => {
    const current = dragRef.current;
    if (!current) return;
    const drop = resolveDrop(clientX, clientY, current.id, mustRootRef.current, niceRootRef.current);
    const next: DragState = {
      ...current,
      x: clientX,
      y: clientY,
      dropRequired: drop?.dropRequired ?? current.dropRequired,
      dropIndex: drop?.dropIndex ?? current.dropIndex,
    };
    dragRef.current = next;
    setDrag(next);
  }, []);

  useEffect(
    () => () => {
      stopDragListenersRef.current?.();
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    },
    []
  );

  return (
    <div className="space-y-4">
      <p className={`mb-1 ${EXPLORE_FLOW.choiceCardTitle}`}>{PACKING_LIST_TITLE}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ packingAckMode: 'strict' })}
          className={exploreFlowChoiceCardClass(mode === 'strict')}
        >
          <p className={EXPLORE_FLOW.choiceCardTitle}>{PACKING_MODE_STRICT_TITLE}</p>
          <p className={EXPLORE_FLOW.choiceCardSubtitle}>{PACKING_MODE_STRICT_SUBTITLE}</p>
        </button>
        <button
          type="button"
          onClick={() => onChange({ packingAckMode: 'lenient' })}
          className={exploreFlowChoiceCardClass(mode === 'lenient')}
        >
          <p className={EXPLORE_FLOW.choiceCardTitle}>{PACKING_MODE_LENIENT_TITLE}</p>
          <p className={EXPLORE_FLOW.choiceCardSubtitle}>{PACKING_MODE_LENIENT_SUBTITLE}</p>
        </button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() =>
            onChange({ packingItems: defaultHikingPackingItems(), packingAckMode: defaultMode })
          }
          className="w-full rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          {PACKING_DEFAULTS_CTA}
        </button>
      ) : null}

      <PackingEditorSection
        title={PACKING_MUST_LABEL}
        hint="Drag to reorder, or drop here from nice-to-have."
        items={must}
        required
        dropIndex={drag?.dropRequired === true ? drag.dropIndex : null}
        placeholderHeight={drag?.dropRequired === true ? drag.height : 0}
        listRef={mustRootRef}
        onGripPointerDown={beginDrag}
        onMove={moveItem}
        onSetRequired={setRequired}
        onRemove={removeItem}
      />
      <PackingEditorSection
        title={PACKING_NICE_LABEL}
        hint="Drag to reorder, or drop here from must-have."
        items={nice}
        required={false}
        dropIndex={drag?.dropRequired === false ? drag.dropIndex : null}
        placeholderHeight={drag?.dropRequired === false ? drag.height : 0}
        listRef={niceRootRef}
        onGripPointerDown={beginDrag}
        onMove={moveItem}
        onSetRequired={setRequired}
        onRemove={removeItem}
      />

      <div className="rounded-2xl border border-neutral-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Add an item</p>
        <div className="flex gap-2">
          <input
            value={draftEmoji}
            onChange={(event) => setDraftEmoji(event.target.value.slice(0, 4))}
            aria-label="Emoji"
            className="w-14 rounded-xl border border-neutral-200 px-2 py-2 text-center text-lg"
          />
          <input
            value={draftLabel}
            onChange={(event) => setDraftLabel(event.target.value)}
            placeholder="e.g. Headlamp"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            maxLength={80}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addItem();
              }
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={draftRequired}
              onChange={(event) => setDraftRequired(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
            />
            Must have
          </label>
          <button
            type="button"
            onClick={addItem}
            disabled={!draftLabel.trim()}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {drag ? (
        <div
          className="pointer-events-none fixed z-[120] flex items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-3 py-2 shadow-2xl"
          style={{
            left: drag.x - drag.grabX,
            top: drag.y - drag.grabY,
            width: drag.width,
            transform: 'scale(1.04) rotate(1.5deg)',
            transition: 'transform 120ms ease',
          }}
        >
          <GripVertical className="h-4 w-4 text-emerald-500" />
          <span className="text-lg" aria-hidden>
            {drag.item.emoji}
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">{drag.item.label}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
            {drag.dropRequired ? 'Must' : 'Nice'}
          </span>
        </div>
      ) : null}
    </div>
  );
};

const PackingEditorSection = ({
  title,
  hint,
  items,
  required,
  dropIndex,
  placeholderHeight,
  listRef,
  onGripPointerDown,
  onMove,
  onSetRequired,
  onRemove,
}: {
  title: string;
  hint: string;
  items: PackingItem[];
  required: boolean;
  dropIndex: number | null;
  placeholderHeight: number;
  listRef: RefObject<HTMLDivElement | null>;
  onGripPointerDown: (event: ReactPointerEvent, item: PackingItem) => void;
  onMove: (id: string, required: boolean, toIndex: number) => void;
  onSetRequired: (id: string, required: boolean) => void;
  onRemove: (id: string) => void;
}) => {
  const rows: ReactNode[] = items.map((item, index) => (
    <PackingEditorRow
      key={item.id}
      item={item}
      required={required}
      index={index}
      count={items.length}
      onGripPointerDown={onGripPointerDown}
      onMove={onMove}
      onSetRequired={onSetRequired}
      onRemove={onRemove}
    />
  ));
  if (dropIndex != null && placeholderHeight > 0) {
    rows.splice(
      Math.min(dropIndex, rows.length),
      0,
      <li
        key="packing-drop-slot"
        aria-hidden
        className="overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/80"
        style={{
          height: placeholderHeight,
          transition: 'height 160ms ease, margin 160ms ease, opacity 160ms ease',
        }}
      />
    );
  }

  return (
    <section>
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mb-2 text-xs text-neutral-500">{hint}</p>
      <div
        ref={listRef}
        className={`rounded-2xl border border-dashed p-2 transition-[background-color,border-color,min-height] duration-200 ${
          dropIndex != null ? 'border-emerald-300 bg-emerald-50/40' : 'border-transparent bg-transparent'
        }`}
      >
        {rows.length === 0 ? (
          <p className="rounded-xl bg-neutral-50 px-3 py-6 text-center text-sm text-neutral-500">
            None yet.
          </p>
        ) : (
          <ul className="space-y-2">{rows}</ul>
        )}
      </div>
    </section>
  );
};

const PackingEditorRow = ({
  item,
  required,
  index,
  count,
  onGripPointerDown,
  onMove,
  onSetRequired,
  onRemove,
}: {
  item: PackingItem;
  required: boolean;
  index: number;
  count: number;
  onGripPointerDown: (event: ReactPointerEvent, item: PackingItem) => void;
  onMove: (id: string, required: boolean, toIndex: number) => void;
  onSetRequired: (id: string, required: boolean) => void;
  onRemove: (id: string) => void;
}) => (
  <li
    data-packing-id={item.id}
    className={`flex items-center gap-1.5 rounded-2xl px-2 py-2 shadow-sm transition-transform duration-200 ease-out sm:gap-2 sm:px-3 ${packingChipClassName(required)}`}
  >
    <button
      type="button"
      onPointerDown={(event) => onGripPointerDown(event, item)}
      className="flex cursor-grab touch-none text-neutral-400 active:cursor-grabbing"
      aria-label={`Drag ${item.label}`}
      style={{ touchAction: 'none' }}
    >
      <GripVertical className="h-4 w-4" />
    </button>
    <span className="text-lg" aria-hidden>
      {item.emoji}
    </span>
    <span className="min-w-0 flex-1 text-sm font-medium text-neutral-900">{item.label}</span>
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => onMove(item.id, required, index - 1)}
        disabled={index === 0}
        className="rounded-t-md p-0.5 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
        aria-label={`Move ${item.label} up`}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onMove(item.id, required, index + 1)}
        disabled={index === count - 1}
        className="rounded-b-md p-0.5 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
        aria-label={`Move ${item.label} down`}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
    <button
      type="button"
      onClick={() => onSetRequired(item.id, !required)}
      className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-600"
    >
      {required ? 'Make nice' : 'Make must'}
    </button>
    <button
      type="button"
      onClick={() => onRemove(item.id)}
      className="text-xs font-semibold text-neutral-400 hover:text-red-600"
      aria-label={`Remove ${item.label}`}
    >
      ✕
    </button>
  </li>
);
