import { Map, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EXPLORE_SEARCH_OPEN_PLACEHOLDER,
  EXPLORE_SEARCH_PROMPT,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from '../../explore/exploreBrowseTaxonomy';
import { exploreSearchScopesForQuery } from '../../explore/exploreSearchScopeUi';
import { ExploreSearchScopeHints } from '../../explore/ui/ExploreSearchScopeHints';
import { BROWSE_LIST_MAP_CTA } from '../browseListCopy';
import { LIST_SEARCH } from '../listChromeTheme';

type ListDiscoverySearchFieldProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onQuerySync?: () => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  onClearQuery?: () => void;
  searchScopeCounts: ExploreSearchScopeCounts;
  mapHref: string;
  showRefine?: boolean;
  onOpenRefine?: () => void;
  compactTop?: boolean;
  hideMapLink?: boolean;
  className?: string;
};

/** List discover — same scope hints + prompt as `ExploreBrowseSearchModal` (inline bar + dropdown). */
export const ListDiscoverySearchField = ({
  query,
  onQueryChange,
  onQuerySync,
  onSearchCommit,
  onClearQuery,
  searchScopeCounts,
  mapHref,
  showRefine = false,
  onOpenRefine,
  compactTop = false,
  hideMapLink = false,
  className = '',
}: ListDiscoverySearchFieldProps) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const hasQuery = query.trim().length > 0;
  const visibleScopes = hasQuery ? exploreSearchScopesForQuery(query, searchScopeCounts) : [];
  const showScopePanel = panelOpen && visibleScopes.length > 0;

  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [panelOpen]);

  const handleQueryChange = (value: string) => {
    onQueryChange(value);
    setPanelOpen(value.trim().length > 0);
  };

  const commitSearch = (scope?: ExploreSearchScopeKey | null) => {
    setPanelOpen(false);
    onSearchCommit?.(scope);
  };

  return (
    <div className={`${compactTop ? 'mt-2' : 'mt-3'} ${className}`.trim()}>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          commitSearch(null);
        }}
      >
        <div ref={anchorRef} className="relative z-40 min-w-0 flex-1">
          <label className={`w-full ${LIST_SEARCH.shell}`}>
            <button
              type="button"
              className="shrink-0 rounded-full p-0.5 text-neutral-400 active:bg-neutral-100"
              aria-label="Open search"
              onClick={() => inputRef.current?.focus()}
            >
              <Search className={LIST_SEARCH.icon} aria-hidden />
            </button>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onFocus={() => {
                if (query.trim().length > 0) setPanelOpen(true);
              }}
              onBlur={() => onQuerySync?.()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitSearch(null);
                }
              }}
              placeholder={EXPLORE_SEARCH_OPEN_PLACEHOLDER}
              className={LIST_SEARCH.input}
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search"
              aria-expanded={panelOpen}
              aria-haspopup="dialog"
            />
            {hasQuery ? (
              <button
                type="button"
                onClick={() => {
                  onQueryChange('');
                  onClearQuery?.();
                  setPanelOpen(false);
                }}
                className="shrink-0 rounded-full p-0.5 text-neutral-500 hover:text-neutral-800"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </label>
          {showScopePanel ? (
            <div
              className="absolute inset-x-0 top-full z-[100] mt-1.5 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,.18)]"
              role="dialog"
              aria-label="Search explore"
              onMouseDown={(event) => event.preventDefault()}
            >
              <p className="px-3 pb-2 pt-3 text-sm font-bold text-neutral-950">{EXPLORE_SEARCH_PROMPT}</p>
              <ExploreSearchScopeHints
                query={query}
                counts={searchScopeCounts}
                onPick={(scope) => commitSearch(scope)}
                className="border-t border-neutral-100"
              />
            </div>
          ) : null}
        </div>
        {hideMapLink ? null : (
          <Link
            to={mapHref}
            className={`${LIST_SEARCH.sideAction} ${LIST_SEARCH.sideActionMap} text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35`}
            aria-label={BROWSE_LIST_MAP_CTA}
          >
            <Map className="h-5 w-5 stroke-[2.25]" aria-hidden />
          </Link>
        )}
        {showRefine && onOpenRefine ? (
          <button type="button" onClick={onOpenRefine} className={LIST_SEARCH.sideAction} aria-label="Refine">
            <SlidersHorizontal className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </form>
    </div>
  );
};
