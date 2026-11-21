import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { EXPLORE_RECENT_SEARCHES_MAX } from './exploreSearchHomeCopy';
import type { ExploreSearchScope } from './exploreSearchRouting';

export const EXPLORE_SEARCH_LAST_SEARCH_KEY = 'uaetrail:search.lastSearch';
export const EXPLORE_RECENT_SEARCHES_KEY = 'uaetrail:explore.recentSearches';
export const EXPLORE_SEARCH_HOME_SCOPE_KEY = 'uaetrail:search.homeScope';

/** Inbound session keys (retired explore hub) — read once and migrate to {@link EXPLORE_SEARCH_*}. */
const INBOUND_HUB_LAST_SEARCH_KEY = 'uaetrail:hub.lastSearch';
const INBOUND_HUB_HOME_SCOPE_KEY = 'uaetrail:hub.homeScope';

/** Isolates latest searches — guest vs signed-in member (same browser). */
export type ExploreSearchStorageScope = 'guest' | `user:${string}`;

export const exploreSearchStorageScope = (
  userId: string | null | undefined
): ExploreSearchStorageScope => (userId ? `user:${userId}` : 'guest');

const storageKey = (base: string, scope: ExploreSearchStorageScope): string => `${base}:${scope}`;

const readScopedItem = (base: string, inboundBase: string, scope: ExploreSearchStorageScope): string | null => {
  const key = storageKey(base, scope);
  const raw = sessionStorage.getItem(key);
  if (raw != null) return raw;
  const inboundKey = storageKey(inboundBase, scope);
  const inbound = sessionStorage.getItem(inboundKey);
  if (inbound == null) return null;
  try {
    sessionStorage.setItem(key, inbound);
    sessionStorage.removeItem(inboundKey);
  } catch {
    /* ignore quota */
  }
  return inbound;
};

export const readExploreSearchHomeScope = (
  scope: ExploreSearchStorageScope = 'guest'
): ExploreSearchScope => {
  try {
    const raw = readScopedItem(EXPLORE_SEARCH_HOME_SCOPE_KEY, INBOUND_HUB_HOME_SCOPE_KEY, scope);
    if (raw === 'places' || raw === 'crew' || raw === 'join') return raw;
  } catch {
    /* ignore */
  }
  return 'join';
};

export const writeExploreSearchHomeScope = (
  mode: ExploreSearchScope,
  scope: ExploreSearchStorageScope = 'guest'
): void => {
  try {
    sessionStorage.setItem(storageKey(EXPLORE_SEARCH_HOME_SCOPE_KEY, scope), mode);
    sessionStorage.removeItem(storageKey(INBOUND_HUB_HOME_SCOPE_KEY, scope));
  } catch {
    /* ignore */
  }
};

export type ExploreSearchLastSearchEntry = {
  query: string;
  activityDatePreset: ExploreActivityDatePreset;
  searchScope: ExploreSearchScope;
  venueRegions?: string[];
};

export const readExploreSearchLastSearch = (
  scope: ExploreSearchStorageScope = 'guest'
): ExploreSearchLastSearchEntry | null => {
  try {
    const raw = readScopedItem(EXPLORE_SEARCH_LAST_SEARCH_KEY, INBOUND_HUB_LAST_SEARCH_KEY, scope);
    if (!raw) return null;
    return normalizeRecentSearch(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
};

const recentSearchFingerprint = (entry: ExploreSearchLastSearchEntry): string =>
  [
    entry.searchScope,
    entry.query.trim().toLowerCase(),
    entry.activityDatePreset,
    (entry.venueRegions ?? []).join(','),
  ].join('|');

const scopeFromRaw = (raw: Record<string, unknown>): ExploreSearchScope | null => {
  const mode = raw.searchScope ?? raw.hubMode;
  if (mode === 'join' || mode === 'places' || mode === 'crew') return mode;
  return null;
};

const normalizeRecentSearch = (raw: unknown): ExploreSearchLastSearchEntry | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const entry = raw as Record<string, unknown>;
  if (typeof entry.query !== 'string' || typeof entry.activityDatePreset !== 'string') return null;
  const searchScope = scopeFromRaw(entry);
  if (!searchScope) return null;
  return {
    query: entry.query,
    activityDatePreset: entry.activityDatePreset as ExploreActivityDatePreset,
    searchScope,
    venueRegions: Array.isArray(entry.venueRegions) ? (entry.venueRegions as string[]) : [],
  };
};

const parseRecentSearchList = (raw: string | null): ExploreSearchLastSearchEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeRecentSearch)
      .filter((entry): entry is ExploreSearchLastSearchEntry => entry != null);
  } catch {
    return [];
  }
};

const migrateUnscopedRecentSearches = (scope: ExploreSearchStorageScope): ExploreSearchLastSearchEntry[] => {
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
): ExploreSearchLastSearchEntry[] => {
  try {
    let list = parseRecentSearchList(
      sessionStorage.getItem(storageKey(EXPLORE_RECENT_SEARCHES_KEY, scope))
    );
    if (list.length === 0 && scope !== 'guest') {
      list = migrateUnscopedRecentSearches(scope);
    }
    if (list.length > 0) return list.slice(0, limit);

    const last = readExploreSearchLastSearch(scope);
    return last ? [last] : [];
  } catch {
    return [];
  }
};

const pushExploreRecentSearch = (
  payload: ExploreSearchLastSearchEntry,
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

export const writeExploreSearchLastSearch = (
  payload: ExploreSearchLastSearchEntry,
  scope: ExploreSearchStorageScope = 'guest'
): void => {
  try {
    sessionStorage.setItem(storageKey(EXPLORE_SEARCH_LAST_SEARCH_KEY, scope), JSON.stringify(payload));
    sessionStorage.removeItem(storageKey(INBOUND_HUB_LAST_SEARCH_KEY, scope));
    pushExploreRecentSearch(payload, scope);
  } catch {
    /* ignore quota */
  }
};