import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  EXPLORE_SEARCH_OPEN_PLACEHOLDER,
  EXPLORE_SEARCH_PROMPT,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import { ExploreSearchScopeHints } from './ExploreSearchScopeHints';
import { EXPLORE_MAP_SEARCH_INPUT_FONT_PX } from './exploreMapPillDropdown';

export type ExploreBrowseSearchPanelProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onCommit: (scope?: ExploreSearchScopeKey | null) => void;
  scopeCounts: ExploreSearchScopeCounts;
  /** Focus input on mount (map search modal). */
  autoFocus?: boolean;
  variant?: 'modal' | 'inline';
};

/** Canonical explore search — map modal + list discover header share this UI. */
export const ExploreBrowseSearchPanel = ({
  query,
  onQueryChange,
  onCommit,
  scopeCounts,
  autoFocus = false,
  variant = 'inline',
}: ExploreBrowseSearchPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasQuery = query.trim().length > 0;
  const showHints = hasQuery;

  useEffect(() => {
    if (!autoFocus) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [autoFocus]);

  const commit = (scope?: ExploreSearchScopeKey | null) => {
    onCommit(scope);
  };

  const inputShell =
    variant === 'modal'
      ? 'flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5'
      : 'flex items-center gap-2';

  return (
    <div className={variant === 'modal' ? 'p-4' : ''}>
      <p className={variant === 'modal' ? 'mb-3 text-sm font-bold text-neutral-950' : 'sr-only'}>
        {EXPLORE_SEARCH_PROMPT}
      </p>
      <label className={inputShell}>
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
              commit(null);
            }
          }}
          placeholder={EXPLORE_SEARCH_OPEN_PLACEHOLDER}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-gray-400"
          style={variant === 'modal' ? { fontSize: EXPLORE_MAP_SEARCH_INPUT_FONT_PX } : undefined}
          aria-label="Search explore"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="shrink-0 text-gray-500 hover:text-gray-800"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </label>
      {showHints ? (
        <ExploreSearchScopeHints
          query={query}
          counts={scopeCounts}
          onPick={(scope) => commit(scope)}
          className={variant === 'modal' ? 'mt-3 border-t border-neutral-100 pt-1' : ''}
        />
      ) : null}
    </div>
  );
};
