import { ArrowDown, ArrowDownAZ, ArrowDownZA, ArrowUp, Calendar, MapPin, Newspaper, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { LIST_OVERLAY_Z, LIST_SEARCH, browseListSortTriggerClass } from '../browse/listChromeTheme';
import {
  DEFAULT_BROWSE_LIST_SORT,
  BROWSE_LIST_SORT_GROUP_DEFS,
  browseListSortAriaLabel,
  browseListSortButtonLabel,
  browseListSortTrigger,
  type BrowseListSortMode,
} from '../browse/listBrowseSort';

type Props = {
  sort: BrowseListSortMode;
  onSortChange: (mode: BrowseListSortMode) => void;
  locationPending?: boolean;
  locationDenied?: boolean;
  className?: string;
  /** Side-map list column — smaller trigger + truncated sort label. */
  compact?: boolean;
};

type SortOption = {
  mode: BrowseListSortMode;
  label: string;
  icon: typeof Calendar;
};

const SORT_OPTION_ICONS: Record<BrowseListSortMode, typeof Calendar> = {
  event_asc: Calendar,
  event_desc: Calendar,
  post_asc: Newspaper,
  post_desc: Newspaper,
  name_asc: ArrowDownAZ,
  name_desc: ArrowDownZA,
  near_me: MapPin,
};

const SORT_GROUPS: ReadonlyArray<{ title: string; options: SortOption[] }> =
  BROWSE_LIST_SORT_GROUP_DEFS.map((group) => ({
    title: group.title,
    options: group.options.map((option) => ({
      ...option,
      icon: SORT_OPTION_ICONS[option.mode],
    })),
  }));

const SORT_SHEET_MAX_WIDTH_PX = 1023;

const useSortSheetLayout = (): boolean => {
  const [sheet, setSheet] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${SORT_SHEET_MAX_WIDTH_PX}px)`);
    const update = () => setSheet(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return sheet;
};

type MenuLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const VIEWPORT_PAD = 10;

const measureDropdownMenu = (anchor: HTMLElement): MenuLayout => {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(288, window.innerWidth - VIEWPORT_PAD * 2);
  let left = rect.right - width;
  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - width - VIEWPORT_PAD));
  const top = rect.bottom + 6;
  const maxHeight = Math.max(120, window.innerHeight - top - VIEWPORT_PAD);
  return { top, left, width, maxHeight };
};

type SortMenuBodyProps = {
  sort: BrowseListSortMode;
  onSortChange: (mode: BrowseListSortMode) => void;
  onClose: () => void;
  locationPending?: boolean;
  locationDenied?: boolean;
  touchFriendly?: boolean;
};

const SortMenuBody = ({
  sort,
  onSortChange,
  onClose,
  locationPending,
  locationDenied,
  touchFriendly = false,
}: SortMenuBodyProps) => (
  <>
    {SORT_GROUPS.map((group) => (
      <div key={group.title} className="border-b border-neutral-100 last:border-b-0">
        <p className="px-2.5 pb-0.5 pt-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-neutral-500 md:text-[10px]">
          {group.title}
        </p>
        <ul className="px-1 pb-1">
          {group.options.map((option) => {
            const active = sort === option.mode;
            const Icon = option.icon;
            return (
              <li key={option.mode}>
                <button
                  type="button"
                  onClick={() => {
                    onSortChange(option.mode);
                    onClose();
                  }}
                  className={`flex w-full items-start gap-2 rounded-xl px-2.5 text-left leading-snug transition ${
                    touchFriendly ? 'min-h-11 py-2 text-[13px]' : 'rounded-lg px-1.5 py-1.5 text-[12px]'
                  } ${
                    active
                      ? 'bg-emerald-50 font-semibold text-emerald-900'
                      : 'text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100'
                  }`}
                >
                  <Icon
                    className={`shrink-0 text-emerald-700 ${touchFriendly ? 'mt-0.5 h-4 w-4' : 'mt-px h-3.5 w-3.5'}`}
                    aria-hidden
                  />
                  <span className="min-w-0">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
    {sort === 'near_me' && locationPending ? (
      <p className="border-t border-neutral-100 px-3 py-2 text-[11px] leading-snug text-neutral-600">
        Getting your location…
      </p>
    ) : null}
    {sort === 'near_me' && locationDenied ? (
      <p className="border-t border-neutral-100 px-3 py-2 text-[11px] leading-snug text-amber-800">
        Location blocked — enable it in the browser to sort by distance.
      </p>
    ) : null}
  </>
);

export const ListExplorerSortControl = ({
  sort,
  onSortChange,
  locationPending,
  locationDenied,
  className = '',
  compact = false,
}: Props) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null);
  const useSheet = useSortSheetLayout();

  const close = () => setOpen(false);

  const updateLayout = useCallback(() => {
    if (!anchorRef.current || useSheet) return;
    setMenuLayout(measureDropdownMenu(anchorRef.current));
  }, [useSheet]);

  useLayoutEffect(() => {
    if (!open || useSheet) {
      setMenuLayout(null);
      return;
    }
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
    };
  }, [open, useSheet, updateLayout]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !useSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, useSheet]);

  useEffect(() => {
    if (!open || useSheet) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      const panel = document.getElementById('list-explorer-sort-menu');
      if (panel?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, useSheet]);

  const activeSort = sort !== DEFAULT_BROWSE_LIST_SORT;
  const triggerMeta = browseListSortTrigger(sort);
  const SortDirectionIcon = triggerMeta.direction === 'asc' ? ArrowUp : ArrowDown;

  const dropdownMenu =
    open && !useSheet && menuLayout
      ? createPortal(
          <div
            id="list-explorer-sort-menu"
            role="dialog"
            aria-label="Sort list"
            className={`fixed ${LIST_OVERLAY_Z} overflow-y-auto overscroll-contain rounded-xl border border-neutral-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,.18)] scroll-touch`}
            style={{
              top: menuLayout.top,
              left: menuLayout.left,
              width: menuLayout.width,
              maxHeight: menuLayout.maxHeight,
            }}
          >
            <SortMenuBody
              sort={sort}
              onSortChange={onSortChange}
              onClose={close}
              locationPending={locationPending}
              locationDenied={locationDenied}
            />
          </div>,
          document.body
        )
      : null;

  const sheetMenu =
    open && useSheet
      ? createPortal(
          <div className={`fixed inset-0 ${LIST_OVERLAY_Z} flex flex-col justify-end`} role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px]"
              aria-label="Close sort"
              onClick={close}
            />
            <div
              id="list-explorer-sort-menu"
              role="dialog"
              aria-label="Sort list"
              className="relative max-h-[min(85dvh,32rem)] overflow-hidden rounded-t-2xl border border-neutral-200/90 bg-white shadow-[0_-8px_40px_rgba(15,23,42,.16)]"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-neutral-900">Sort</p>
                  <p className="truncate text-xs font-medium text-emerald-800">
                    {browseListSortButtonLabel(sort)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className={`${LIST_SEARCH.sideAction} !h-9 !w-9 shrink-0 text-neutral-600`}
                  aria-label="Close"
                >
                  <X className="h-4 w-4 stroke-[2.25]" aria-hidden />
                </button>
              </div>
              <div className="max-h-[min(70dvh,26rem)] overflow-y-auto overscroll-contain scroll-touch px-1 pt-1">
                <SortMenuBody
                  sort={sort}
                  onSortChange={onSortChange}
                  onClose={close}
                  locationPending={locationPending}
                  locationDenied={locationDenied}
                  touchFriendly
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className={`${LIST_SEARCH.sideAction} ${browseListSortTriggerClass(activeSort)} !inline-flex min-w-9 !w-auto max-w-full ${
        compact ? '!h-7 min-w-7 max-w-[6.5rem] gap-0.5 px-1.5' : '!h-8 gap-1 px-2'
      }`}
      aria-label={browseListSortAriaLabel(sort)}
      aria-expanded={open}
      aria-haspopup="dialog"
    >
      <SortDirectionIcon
        className={`shrink-0 stroke-[2.25] ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`}
        aria-hidden
      />
      <span
        className={`min-w-0 truncate font-semibold leading-tight ${
          compact ? 'text-[10px]' : 'text-[11px]'
        }`}
      >
        {triggerMeta.label}
      </span>
    </button>
  );

  return (
    <div ref={anchorRef} className={`relative min-w-0 ${className}`}>
      {useSheet ? trigger : <UiTooltip label={browseListSortAriaLabel(sort)}>{trigger}</UiTooltip>}
      {dropdownMenu}
      {sheetMenu}
    </div>
  );
};
