import {
  EXPLORE_SEARCH_SCOPE_COPY,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import { exploreSearchScopesForQuery, exploreSearchScopeTitleMatchesQuery } from '../exploreSearchScopeUi';
import { EXPLORE_TYPE } from '../../config/exploreTheme';

type ExploreSearchScopeHintsProps = {
  query: string;
  counts: ExploreSearchScopeCounts;
  onPick: (scope: ExploreSearchScopeKey) => void;
  className?: string;
};

const formatCount = (count: number) => (count === 1 ? '1 match' : `${count} matches`);

export const ExploreSearchScopeHints = ({
  query,
  counts,
  onPick,
  className = '',
}: ExploreSearchScopeHintsProps) => {
  const scopes = exploreSearchScopesForQuery(query, counts);
  if (scopes.length === 0) return null;

  return (
    <ul className={`divide-y divide-neutral-100 ${className}`} role="listbox" aria-label="Search categories">
      {scopes.map((scope) => {
        const { label, description, shipped } = EXPLORE_SEARCH_SCOPE_COPY[scope];
        const count = counts[scope];
        const titleMatch = exploreSearchScopeTitleMatchesQuery(scope, query);
        const disabled = !shipped || (count === 0 && !titleMatch);
        return (
          <li key={scope} role="presentation">
            <button
              type="button"
              role="option"
              disabled={disabled}
              onClick={() => onPick(scope)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition ${
                disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-neutral-50 active:bg-neutral-100'
              }`}
            >
              <span className="min-w-0">
                <span className={`block text-sm font-bold ${EXPLORE_TYPE.title}`}>{label}</span>
                <span className={`block truncate text-xs font-medium ${EXPLORE_TYPE.muted}`}>{description}</span>
              </span>
              <span className={`shrink-0 text-xs font-bold tabular-nums ${EXPLORE_TYPE.body}`}>
                {shipped ? formatCount(count) : 'Soon'}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
