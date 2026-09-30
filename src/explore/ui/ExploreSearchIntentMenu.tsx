import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  EXPLORE_SEARCH_OPEN_PLACEHOLDER,
  EXPLORE_SEARCH_PROMPT,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import { EXPLORE_MAP_TOOLBAR_FLOATING } from '../../config/exploreTheme';
import { ExploreSearchScopeHints } from './ExploreSearchScopeHints';

type ExploreSearchIntentMenuProps = {
  query?: string;
  onQueryChange?: (value: string) => void;
  onQueryCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  scopeCounts?: ExploreSearchScopeCounts;
  /** `map` = floating control on the map; `field` = icon beside the list search input (deprecated) */
  variant?: 'map' | 'field';
  className?: string;
  ariaLabel?: string;
};

export const ExploreSearchIntentMenu = ({
  query = '',
  onQueryChange,
  onQueryCommit,
  scopeCounts = { trips: 0, spots: 0, shops: 0, facilities: 0 },
  variant = 'field',
  className = '',
  ariaLabel = 'Search',
}: ExploreSearchIntentMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();
  const mapSearch = variant === 'map' && onQueryChange != null;
  const showHints = mapSearch && query.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !mapSearch) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open, mapSearch]);

  const commitSearch = (scope?: ExploreSearchScopeKey | null) => {
    onQueryCommit?.(scope);
    setOpen(false);
  };

  const triggerClass =
    variant === 'map'
      ? `${EXPLORE_MAP_TOOLBAR_FLOATING} inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-900`
      : 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-neutral-100 hover:text-gray-800';

  if (!mapSearch) {
    return null;
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className={triggerClass}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-label="Search explore"
          className="absolute left-0 top-full z-[1200] mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,.16)]"
        >
          <div className="p-3">
            <p className="mb-2 text-sm font-bold text-neutral-950">{EXPLORE_SEARCH_PROMPT}</p>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitSearch(null);
                  }
                }}
                placeholder={EXPLORE_SEARCH_OPEN_PLACEHOLDER}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
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
      ) : null}
    </div>
  );
};
