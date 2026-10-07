import {
  EXPLORE_SEARCH_SCOPE_COPY,
  EXPLORE_SEARCH_SCOPE_UI_ORDER,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from './exploreBrowseTaxonomy';

const normalize = (value: string): string => value.trim().toLowerCase();

/** Type-ahead on scope titles (Activities, Places, …). */
export const exploreSearchScopeTitleMatchesQuery = (
  scope: ExploreSearchScopeKey,
  query: string
): boolean => {
  const q = normalize(query);
  if (!q) return false;
  const label = EXPLORE_SEARCH_SCOPE_COPY[scope].label.toLowerCase();
  if (label.startsWith(q) || label.includes(q)) return true;
  return q.split(/\s+/).every((token) => token.length > 0 && label.includes(token));
};

/** Scopes to show under the search field — only after user types; title match or matches in bucket. */
export const exploreSearchScopesForQuery = (
  query: string,
  counts: ExploreSearchScopeCounts
): ExploreSearchScopeKey[] => {
  const q = query.trim();
  if (!q) return [];

  return EXPLORE_SEARCH_SCOPE_UI_ORDER.filter((scope) => {
    const { shipped } = EXPLORE_SEARCH_SCOPE_COPY[scope];
    if (!shipped) return false;
    const count = counts[scope];
    return count > 0 || exploreSearchScopeTitleMatchesQuery(scope, q);
  });
};
