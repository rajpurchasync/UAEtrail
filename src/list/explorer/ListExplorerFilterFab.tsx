import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { BrowseListFilterState } from '../browseListFilters';
import type { ListExplorerBucket } from '../browse/browseListBucket';
import { ListExplorerFilterPop, type ListFilterPopFixedLayout } from './ListExplorerFilterPop';
import { LIST_FILTER_FAB_Z, LIST_HUB_SEARCH_ROW } from '../listChromeTheme';
import { EXPLORE_MAP_CHROME_FROST } from '../../config/exploreTheme';
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
  /** Inline beside search on standalone mobile list; default floating FAB. */
  placement?: 'floating' | 'inline';
  /** Match map toolbar frost pills (standalone `/list` mobile chrome) or hub list row. */
  inlineChrome?: 'default' | 'mapFrost' | 'listSide';
};

const readCssPx = (value: string, fallback: number): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const FILTER_POP_MAX_WIDTH_PX = 328;
const FILTER_VIEWPORT_PAD_PX = 10;

const measureInlineFilterMenu = (anchor: HTMLElement): ListFilterPopFixedLayout => {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(FILTER_POP_MAX_WIDTH_PX, window.innerWidth - FILTER_VIEWPORT_PAD_PX * 2);
  let left = rect.right - width;
  left = Math.max(
    FILTER_VIEWPORT_PAD_PX,
    Math.min(left, window.innerWidth - width - FILTER_VIEWPORT_PAD_PX)
  );
  const top = rect.bottom + 6;
  const maxHeight = Math.max(120, window.innerHeight - top - FILTER_VIEWPORT_PAD_PX);
  return { top, left, width, maxHeight };
};

export const ListExplorerFilterFab = ({
  bucket,
  applied,
  regions,
  filterCount,
  onApply,
  placement = 'floating',
  inlineChrome = 'default',
}: ListExplorerFilterFabProps) => {
  const inline = placement === 'inline';
  const [corner, setCorner] = useState<ListFilterFabCorner>(() => readListFilterFabCorner());
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const [inlineMenuLayout, setInlineMenuLayout] = useState<ListFilterPopFixedLayout | null>(null);
  const origin = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const moved = useRef(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistListFilterFabCorner(corner);
  }, [corner]);

  const updateInlineMenuLayout = useCallback(() => {
    if (!fabRef.current) return;
    setInlineMenuLayout(measureInlineFilterMenu(fabRef.current));
  }, []);

  useLayoutEffect(() => {
    if (!open || !inline) {
      setInlineMenuLayout(null);
      return;
    }
    updateInlineMenuLayout();
    window.addEventListener('resize', updateInlineMenuLayout);
    window.addEventListener('scroll', updateInlineMenuLayout, true);
    return () => {
      window.removeEventListener('resize', updateInlineMenuLayout);
      window.removeEventListener('scroll', updateInlineMenuLayout, true);
    };
  }, [open, inline, updateInlineMenuLayout]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (fabRef.current?.contains(target)) return;
      if (inline) {
        const panel = document.getElementById('list-explorer-filter-menu');
        if (panel?.contains(target)) return;
      }
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, inline]);

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

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (inline) return;
      origin.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
      moved.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [inline]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (inline) return;
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
    },
    [inline]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (inline) return;
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
    [inline]
  );

  const snapped = listFilterFabCornerStyle(corner, insets());
  const positionStyle = live ? { top: live.y, left: live.x } : snapped;

  const triggerClass = inline
    ? inlineChrome === 'listSide'
      ? LIST_HUB_SEARCH_ROW.filterAction(filterCount > 0)
      : inlineChrome === 'mapFrost'
        ? `relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 transition ${EXPLORE_MAP_CHROME_FROST} ${
            filterCount > 0 ? 'text-emerald-800' : 'text-neutral-800 hover:bg-white/80'
          }`
        : `relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
            filterCount > 0
              ? 'text-emerald-700 hover:bg-emerald-50'
              : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
          }`
    : `inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_4px_20px_rgba(15,23,42,.18)] ring-1 ring-black/[0.06] transition md:h-9 md:w-9 ${
        filterCount > 0
          ? 'border-emerald-700 bg-emerald-700 text-white'
          : 'border-white/80 bg-white text-neutral-900'
      } ${dragging ? 'cursor-grabbing scale-105' : 'cursor-grab active:scale-95'}`;

  const showBadge = filterCount > 0;
  const badge = showBadge ? (
      <span
        className={
          inline && inlineChrome === 'listSide'
            ? LIST_HUB_SEARCH_ROW.filterBadge
            : `absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white md:h-4 md:min-w-4 md:text-[9px] md:ring-1`
        }
      >
        {filterCount > 9 ? '9+' : filterCount}
      </span>
    ) : null;

  const trigger = (
    <button
      type="button"
      aria-label={filterCount > 0 ? `Filters, ${filterCount} applied` : 'Filters'}
      aria-expanded={open}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={inline ? undefined : onPointerUp}
      onClick={inline ? () => setOpen((prev) => !prev) : undefined}
      className={triggerClass}
    >
      <SlidersHorizontal
        className={
          inline
            ? inlineChrome === 'listSide'
              ? 'h-5 w-5 stroke-[2.25]'
              : 'h-4 w-4 stroke-[2.25]'
            : 'h-5 w-5 stroke-[2.25] md:h-4 md:w-4'
        }
        aria-hidden
      />
      {badge}
    </button>
  );

  const pop = (
    <ListExplorerFilterPop
      open={open && !dragging && (!inline || inlineMenuLayout !== null)}
      corner={inline ? 'below-end' : corner}
      bucket={bucket}
      applied={applied}
      regions={regions}
      onApply={onApply}
      onClose={() => setOpen(false)}
      fixedLayout={inline ? inlineMenuLayout : null}
    />
  );

  if (inline) {
    return (
      <div ref={fabRef} className="relative shrink-0">
        {trigger}
        {pop}
      </div>
    );
  }

  return (
    <div
      ref={fabRef}
      className={`pointer-events-none fixed ${LIST_FILTER_FAB_Z}`}
      style={{
        ...positionStyle,
        width: live ? LIST_FILTER_FAB_SIZE : undefined,
      }}
    >
      <div className="pointer-events-auto relative">
        {trigger}
        {pop}
      </div>
    </div>
  );
};
