import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { EXPLORE_RECENT_SEARCHES_MAX } from './exploreHubHomeCopy';
import type { ExploreHubMode } from './exploreHubRouting';

export const EXPLORE_HUB_LAST_SEARCH_KEY = 'uaetrail:hub.lastSearch';
export const EXPLORE_RECENT_SEARCHES_KEY = 'uaetrail:explore.recentSearches';
export const EXPLORE_HUB_HOME_SCOPE_KEY = 'uaetrail:hub.homeScope';

/** Isolates latest searches — guest vs signed-in member (same browser). */
export type ExploreSearchStorageScope = 'guest' | `user:${string}`;

export const exploreSearchStorageScope = (
  userId: string | null | undefined
): ExploreSearchStorageScope => (userId ? `user:${userId}` : 'guest');

const storageKey = (base: string, scope: ExploreSearchStorageScope): string => `${base}:${scope}`;

export const readExploreHubHomeScope = (
  scope: ExploreSearchStorageScope = 'guest'
): ExploreHubMode => {
  try {
    const raw = sessionStorage.getItem(storageKey(EXPLORE_HUB_HOME_SCOPE_KEY, scope));
    if (raw === 'places' || raw === 'crew' || raw === 'join') return raw;
  } catch {
    /* ignore */
  }
  return 'join';
};

export const writeExploreHubHomeScope = (
  mode: ExploreHubMode,
  scope: ExploreSearchStorageScope = 'guest'
): void => {
  try {
    sessionStorage.setItem(storageKey(EXPLORE_HUB_HOME_SCOPE_KEY, scope), mode);
  } catch {
    /* ignore */
  }
};

export type ExploreHubLastSearch = {
  query: string;
  activityDatePreset: ExploreActivityDatePreset;
  hubMode: ExploreHubMode;
  venueRegions?: string[];
};

export const readExploreHubLastSearch = (
  scope: ExploreSearchStorageScope = 'guest'
): ExploreHubLastSearch | null => {
  try {
    const raw = sessionStorage.getItem(storageKey(EXPLORE_HUB_LAST_SEARCH_KEY, scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExploreHubLastSearch;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      ...parsed,
      venueRegions: Array.isArray(parsed.venueRegions) ? parsed.venueRegions : [],
    };
  } catch {
    return null;
  }
};

const recentSearchFingerprint = (entry: ExploreHubLastSearch): string =>
  [
    entry.hubMode,
    entry.query.trim().toLowerCase(),
    entry.activityDatePreset,
    (entry.venueRegions ?? []).join(','),
  ].join('|');

const normalizeRecentSearch = (raw: unknown): ExploreHubLastSearch | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const entry = raw as ExploreHubLastSearch;
  if (typeof entry.query !== 'string' || typeof entry.activityDatePreset !== 'string') return null;
  const hubMode = entry.hubMode;
  if (hubMode !== 'join' && hubMode !== 'places' && hubMode !== 'crew') return null;
  return {
    query: entry.query,
    activityDatePreset: entry.activityDatePreset,
    hubMode,
    venueRegions: Array.isArray(entry.venueRegions) ? entry.venueRegions : [],
  };
};

const parseRecentSearchList = (raw: string | null): ExploreHubLastSearch[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeRecentSearch)
      .filter((entry): entry is ExploreHubLastSearch => entry != null);
  } catch {
    return [];
  }
};

const migrateUnscopedRecentSearches = (scope: ExploreSearchStorageScope): ExploreHubLastSearch[] => {
  if (scope === 'guest') return [];
  const unscopedRaw = sessionStorage.getItem(EXPLORE_RECENT_SEARCHES_KEY);
  if (!unscopedRaw) return [];
  const unscoped = parseRecentSearchList(unscopedRaw);
  if (unscoped.length > 0) {
    sessionStorage.setItem(
      storageKey(EXPLORE_RECENT_SEARCHES_KEY, scope),
      JSON.stringify(unscoped.slice(0, EXPLORE_RECENT_SEARCHES_MAX))
    );
    sessionStorage.removeItem(EXPLORE_RECENT_SEARCHES_KEY);
  }
  return unscoped;
};

/** Up to {@link EXPLORE_RECENT_SEARCHES_MAX} distinct recent commits (newest first). */
export const readExploreRecentSearches = (
  limit = EXPLORE_RECENT_SEARCHES_MAX,
  scope: ExploreSearchStorageScope = 'guest'
): ExploreHubLastSearch[] => {
  try {
    let list = parseRecentSearchList(
      sessionStorage.getItem(storageKey(EXPLORE_RECENT_SEARCHES_KEY, scope))
    );
    if (list.length === 0 && scope !== 'guest') {
      list = migrateUnscopedRecentSearches(scope);
    }
    if (list.length > 0) return list.slice(0, limit);

    const last = readExploreHubLastSearch(scope);
    return last ? [last] : [];
  } catch {
    return [];
  }
};

const pushExploreRecentSearch = (
  payload: ExploreHubLastSearch,
  scope: ExploreSearchStorageScope
): void => {
  const fingerprint = recentSearchFingerprint(payload);
  const next = [
    payload,
    ...readExploreRecentSearches(10, scope).filter(
      (entry) => recentSearchFingerprint(entry) !== fingerprint
    ),
  ].slice(0, EXPLORE_RECENT_SEARCHES_MAX);
  sessionStorage.setItem(storageKey(EXPLORE_RECENT_SEARCHES_KEY, scope), JSON.stringify(next));
};

export const writeExploreHubLastSearch = (
  payload: ExploreHubLastSearch,
  scope: ExploreSearchStorageScope = 'guest'
): void => {
  try {
    sessionStorage.setItem(storageKey(EXPLORE_HUB_LAST_SEARCH_KEY, scope), JSON.stringify(payload));
    pushExploreRecentSearch(payload, scope);
  } catch {
    /* ignore quota */
  }
};