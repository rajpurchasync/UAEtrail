import { createPortal } from 'react-dom';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import {
  EXPLORE_SEARCH_OPEN_PLACEHOLDER,
  EXPLORE_SEARCH_PROMPT,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import { EXPLORE_MAP_TOOLBAR_FLOATING } from '../../config/exploreTheme';
import { ExploreSearchScopeHints } from './ExploreSearchScopeHints';
import {
  EXPLORE_MAP_SEARCH_INPUT_FONT_PX,
  useExploreMapPillDropdown,
} from './exploreMapPillDropdown';

type ExploreSearchIntentMenuProps = {
  query?: string;
  onQueryChange?: (value: string) => void;
  onQueryCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  scopeCounts?: ExploreSearchScopeCounts;
  /** `map` = floating control on the map; `field` = icon beside the list search input (deprecated) */
  variant?: 'map' | 'mapSegment' | 'field';
  className?: string;
  ariaLabel?: string;
  active?: boolean;
  /** Stack above map chrome (defaults high enough for map toolbar). */
  dropdownZClass?: string;
  /** Map segment search — position below entire intent bar (not the tiny icon). */
  dropdownPositionBelowRef?: RefObject<HTMLElement | null>;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
};

const MAP_SEARCH_Z = 3300;

export const ExploreSearchIntentMenu = ({
  query = '',
  onQueryChange,
  onQueryCommit,
  scopeCounts = { trips: 0, spots: 0, shops: 0, facilities: 0 },
  variant = 'field',
  className = '',
  ariaLabel = 'Search',
  active = false,
  dropdownZClass = 'z-[3200]',
  dropdownPositionBelowRef,
  menuOpen: menuOpenProp,
  onMenuOpenChange,
}: ExploreSearchIntentMenuProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = menuOpenProp ?? internalOpen;
  const setOpen = (next: boolean | ((current: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(open) : next;
    if (menuOpenProp === undefined) setInternalOpen(resolved);
    onMenuOpenChange?.(resolved);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();
  const mapSearch = (variant === 'map' || variant === 'mapSegment') && onQueryChange != null;
  const mapFloatingMenu = mapSearch && (variant === 'map' || variant === 'mapSegment');
  const showHints = mapSearch && query.trim().length > 0;

  const { anchorRef, menuRef, menuStyle } = useExploreMapPillDropdown({
    open: mapFloatingMenu ? open : false,
    onOpenChange: setOpen,
    layout: 'fullWidth',
    zIndex: MAP_SEARCH_Z,
    positionBelowRef: variant === 'mapSegment' ? dropdownPositionBelowRef : undefined,
    repositionDeps: [query, showHints],
  });

  useEffect(() => {
    if (!open || mapFloatingMenu) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, mapFloatingMenu]);

  useEffect(() => {
    if (!open || !mapSearch) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open, mapSearch]);

  const commitSearch = (scope?: ExploreSearchScopeKey | null) => {
    onQueryCommit?.(scope);
    setOpen(false);
  };

  const segmentHighlighted = variant === 'mapSegment' ? open : active || open;
  const segmentUnderline =
    "after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-emerald-600 after:content-['']";

  const triggerClass =
    variant === 'mapSegment'
      ? `relative inline-flex h-7 w-11 shrink-0 items-center justify-center text-lg leading-none text-gray-900 [-webkit-tap-highlight-color:transparent] ${
          segmentHighlighted ? segmentUnderline : ''
        }`
      : variant === 'map'
        ? `${EXPLORE_MAP_TOOLBAR_FLOATING} inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-900`
        : 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-neutral-100 hover:text-gray-800';

  if (!mapSearch) {
    return null;
  }

  const menuPanel = (
    <div
      ref={mapFloatingMenu ? menuRef : undefined}
      id={menuId}
      role="dialog"
      aria-label="Search explore"
      style={mapFloatingMenu ? menuStyle : undefined}
      className={
        mapFloatingMenu
          ? 'rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,.16)]'
          : `absolute left-0 top-full ${dropdownZClass} mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,.16)]`
      }
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <div className="p-3">
        <p className="mb-2 text-sm font-bold text-neutral-950">{EXPLORE_SEARCH_PROMPT}</p>
        <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitSearch(null);
              }
            }}
            placeholder={EXPLORE_SEARCH_OPEN_PLACEHOLDER}
            className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-gray-400 ${
              mapFloatingMenu ? '' : 'text-sm'
            }`}
            style={
              mapFloatingMenu
                ? { fontSize: EXPLORE_MAP_SEARCH_INPUT_FONT_PX }
                : undefined
            }
          />
          {query.trim() ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="shrink-0 text-gray-500 hover:text-gray-800"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>
      </div>
      {showHints ? (
        <ExploreSearchScopeHints
          counts={scopeCounts}
          onPick={(scope) => commitSearch(scope)}
          className="border-t border-neutral-100"
        />
      ) : null}
    </div>
  );

  const menu =
    open && mapFloatingMenu && typeof document !== 'undefined'
      ? createPortal(menuPanel, document.body)
      : open && !mapFloatingMenu
        ? menuPanel
        : null;

  const wrapperRef = mapFloatingMenu ? anchorRef : rootRef;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        className={triggerClass}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {variant === 'mapSegment' ? (
          <span className="font-emoji" aria-hidden>🔍</span>
        ) : (
          <Search className="h-4 w-4 shrink-0" aria-hidden />
        )}
      </button>

      {!mapFloatingMenu ? menu : open ? menu : null}
    </div>
  );
};
