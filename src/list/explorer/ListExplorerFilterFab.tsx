import { useCallback, useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { BrowseListFilterState } from '../browseListFilters';
import type { ListExplorerBucket } from './listExplorerBucket';
import { ListExplorerFilterPop } from './ListExplorerFilterPop';
import {
  LIST_FILTER_FAB_DRAG_PX,
  LIST_FILTER_FAB_EDGE,
  LIST_FILTER_FAB_SIZE,
  listFilterFabCornerStyle,
  persistListFilterFabCorner,
  readListFilterFabCorner,
  snapListFilterFabCorner,
  type ListFilterFabCorner,
} from './listExplorerFabSnap';

type ListExplorerFilterFabProps = {
  bucket: ListExplorerBucket;
  applied: BrowseListFilterState;
  regions: string[];
  filterCount: number;
  onApply: (state: BrowseListFilterState, regions: string[]) => void;
};

const readCssPx = (value: string, fallback: number): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const ListExplorerFilterFab = ({
  bucket,
  applied,
  regions,
  filterCount,
  onApply,
}: ListExplorerFilterFabProps) => {
  const [corner, setCorner] = useState<ListFilterFabCorner>(() => readListFilterFabCorner());
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const origin = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const moved = useRef(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistListFilterFabCorner(corner);
  }, [corner]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const insets = () => {
    const styles = getComputedStyle(document.documentElement);
    const safeTop = readCssPx(styles.getPropertyValue('--safe-top'), 0);
    const safeBottom = readCssPx(styles.getPropertyValue('--safe-bottom'), 0);
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const navVar = readCssPx(styles.getPropertyValue('--bottom-nav-height'), 56);
    const nav = mobile ? Math.max(navVar, 56) : 0;
    const createFab = mobile ? 64 : 0;
    const sideNavRight = mobile
      ? 0
      : document.querySelector('[data-desktop-side-nav]')?.getBoundingClientRect().right ?? 0;
    return {
      top: Math.max(safeTop, 8) + 56,
      bottom: safeBottom + nav + LIST_FILTER_FAB_EDGE + (corner === 'br' ? createFab : 0),
      left: LIST_FILTER_FAB_EDGE + sideNavRight,
      right: LIST_FILTER_FAB_EDGE,
    };
  };

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    origin.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
    moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const start = origin.current;
    if (!start || event.pointerId !== start.pointer) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!moved.current && dx * dx + dy * dy < LIST_FILTER_FAB_DRAG_PX * LIST_FILTER_FAB_DRAG_PX) {
      return;
    }
    moved.current = true;
    setOpen(false);
    setDragging(true);
    setLive({
      x: event.clientX - LIST_FILTER_FAB_SIZE / 2,
      y: event.clientY - LIST_FILTER_FAB_SIZE / 2,
    });
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const start = origin.current;
      origin.current = null;
      if (start && event.pointerId === start.pointer) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (moved.current) {
        const next = snapListFilterFabCorner(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
        setCorner(next);
        setDragging(false);
        setLive(null);
        return;
      }
      setDragging(false);
      setLive(null);
      setOpen((prev) => !prev);
    },
    []
  );

  const snapped = listFilterFabCornerStyle(corner, insets());
  const positionStyle = live
    ? { top: live.y, left: live.x }
    : snapped;

  return (
    <div
      ref={fabRef}
      className="pointer-events-none fixed z-[1220]"
      style={{
        ...positionStyle,
        width: live ? LIST_FILTER_FAB_SIZE : undefined,
      }}
    >
      <div className="pointer-events-auto relative">
        <button
          type="button"
          aria-label={filterCount > 0 ? `Filters, ${filterCount} applied` : 'Filters'}
          aria-expanded={open}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_4px_20px_rgba(15,23,42,.18)] ring-1 ring-black/[0.06] transition ${
            filterCount > 0
              ? 'border-emerald-700 bg-emerald-700 text-white'
              : 'border-white/80 bg-white text-neutral-900'
          } ${dragging ? 'cursor-grabbing scale-105' : 'cursor-grab active:scale-95'}`}
        >
          <SlidersHorizontal className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-white ${
              filterCount > 0 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {filterCount > 9 ? '9+' : filterCount}
          </span>
        </button>
        <ListExplorerFilterPop
          open={open && !dragging}
          corner={corner}
          bucket={bucket}
          applied={applied}
          regions={regions}
          onApply={onApply}
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
};
