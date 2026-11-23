import {
  EXPLORE_SEARCH_SCOPE_COPY,
  EXPLORE_SEARCH_SCOPE_UI_ORDER,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from './exploreBrowseTaxonomy';

const normalize = (value: string): string => value.trim().toLowerCase();

/** Member discovery — roster API, not `GET /explore/map` pin counts. */
export const exploreSearchScopeUsesMapMatchCounts = (scope: ExploreSearchScopeKey): boolean =>
  scope !== 'people';

/** Type-ahead on scope titles (Activities, Places, …). */
export const exploreSearchScopeTitleMatchesQuery = (
  scope: ExploreSearchScopeKey,
  query: string
): boolean => {
  const q = normalize(query);
  if (!q) return false;
  if (scope === 'people') {
    const discoverAliases = [
      'friends',
      'people',
      'person',
      'member',
      'members',
      'host',
      'hosts',
      'profile',
      'profiles',
    ];
    if (discoverAliases.some((word) => word.startsWith(q) || q.includes(word))) return true;
  }
  const label = EXPLORE_SEARCH_SCOPE_COPY[scope].label.toLowerCase();
  if (label.startsWith(q) || label.includes(q)) return true;
  return q.split(/\s+/).every((token) => token.length > 0 && label.includes(token));
};

/** Scopes to show under the search field — only after user types; title match or matches in bucket. */
export const exploreSearchScopesForQuery = (
  query: string,
  counts: ExploreSearchScopeCounts,
  options?: { signedIn?: boolean }
): ExploreSearchScopeKey[] => {
  const q = query.trim();
  if (!q) return [];
  const signedIn = options?.signedIn !== false;

  return EXPLORE_SEARCH_SCOPE_UI_ORDER.filter((scope) => {
    if (!signedIn && scope === 'people') return false;
    const { shipped } = EXPLORE_SEARCH_SCOPE_COPY[scope];
    if (!shipped) return false;
    if (!exploreSearchScopeUsesMapMatchCounts(scope)) {
      return q.length >= 2;
    }
    const count = counts[scope];
    return count > 0 || exploreSearchScopeTitleMatchesQuery(scope, q);
  });
};
