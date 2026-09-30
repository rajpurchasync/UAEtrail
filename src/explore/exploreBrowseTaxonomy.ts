import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExplorePanel } from './routing';
import type { ExplorePinKindFilter } from './explorePinKindFilter';
import type { DesktopBrowseTab } from './ui/exploreBrowsePanelCopy';

/**
 * Canonical explore browse taxonomy — map pills + search scopes.
 * @see docs/experiment/explore-browse-taxonomy.md
 */

export const EXPLORE_SEARCH_PROMPT = 'What are you looking for?';

export const EXPLORE_SEARCH_OPEN_PLACEHOLDER = 'Trips, spots, shops, hosts…';

/** Map chrome — multi-select filter pills. */
export type ExploreMapFilterPillKey = 'trips' | 'looking' | 'spots' | 'shops';

export const EXPLORE_MAP_FILTER_PILLS: ReadonlyArray<{ key: ExploreMapFilterPillKey; label: string }> = [
  { key: 'trips', label: 'Trips' },
  { key: 'looking', label: 'Looking for' },
  { key: 'spots', label: 'Spots' },
  { key: 'shops', label: 'Shops' },
];

/** Search type-ahead scopes (Facilities = later). */
export type ExploreSearchScopeKey = 'trips' | 'spots' | 'shops' | 'facilities';

export const EXPLORE_SEARCH_SCOPES_SHIPPED: readonly ExploreSearchScopeKey[] = ['trips', 'spots', 'shops'];

export const EXPLORE_SEARCH_SCOPE_COPY: Record<
  ExploreSearchScopeKey,
  { label: string; description: string; shipped: boolean }
> = {
  trips: {
    label: 'Trips',
    description: 'Hosted hikes, camps, carpools, events',
    shipped: true,
  },
  spots: {
    label: 'Spots',
    description: 'Trails, camps, outdoor places',
    shipped: true,
  },
  shops: {
    label: 'Shops',
    description: 'Gear and outdoor shops',
    shipped: true,
  },
  facilities: {
    label: 'Facilities',
    description: 'Toilets, water, fuel — coming soon',
    shipped: false,
  },
};

const isShopPin = (item: ExploreMapItemDTO): boolean =>
  item.source === 'shop' && item.kind === 'shop' && !item.id.startsWith('product:');

/** Hosted organize layer only — all activity kinds. */
export const mapItemMatchesTripsPill = (item: ExploreMapItemDTO): boolean => item.source === 'activity';

export const mapItemMatchesLookingPill = (item: ExploreMapItemDTO): boolean => item.source === 'demand';

/** Catalog venues (trails, camps, places) — not shops. */
export const mapItemMatchesSpotsPill = (item: ExploreMapItemDTO): boolean =>
  item.source === 'venue' && !isShopPin(item);

export const mapItemMatchesShopsPill = (item: ExploreMapItemDTO): boolean =>
  isShopPin(item) || item.kind === 'shop';

export const mapItemMatchesFilterPill = (item: ExploreMapItemDTO, pill: ExploreMapFilterPillKey): boolean => {
  switch (pill) {
    case 'trips':
      return mapItemMatchesTripsPill(item);
    case 'looking':
      return mapItemMatchesLookingPill(item);
    case 'spots':
      return mapItemMatchesSpotsPill(item);
    case 'shops':
      return mapItemMatchesShopsPill(item);
    default:
      return false;
  }
};

export const mapItemMatchesFilterPills = (
  item: ExploreMapItemDTO,
  selected: readonly ExploreMapFilterPillKey[]
): boolean => {
  if (selected.length === 0) return true;
  return selected.some((pill) => mapItemMatchesFilterPill(item, pill));
};

/** Search scope predicates (same buckets as pills where applicable). */
export const mapItemMatchesSearchScope = (
  item: ExploreMapItemDTO,
  scope: ExploreSearchScopeKey
): boolean => {
  switch (scope) {
    case 'trips':
      return mapItemMatchesTripsPill(item);
    case 'spots':
      return mapItemMatchesSpotsPill(item);
    case 'shops':
      return mapItemMatchesShopsPill(item);
    case 'facilities':
      // Later: facility tags on venues or dedicated pins.
      return false;
    default:
      return false;
  }
};

const FILTER_PILL_SET = new Set<ExploreMapFilterPillKey>(EXPLORE_MAP_FILTER_PILLS.map((p) => p.key));

const LEGACY_TOPIC_TO_PILL: Record<string, ExploreMapFilterPillKey> = {
  hiking: 'trips',
  camping: 'trips',
  activity: 'trips',
  looking: 'looking',
  shop: 'shops',
};

export const parseExploreMapFilterPillsParam = (value: string | null): ExploreMapFilterPillKey[] => {
  if (!value?.trim()) return [];
  const keys = value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .map((part) => LEGACY_TOPIC_TO_PILL[part] ?? part)
    .filter((part): part is ExploreMapFilterPillKey => FILTER_PILL_SET.has(part as ExploreMapFilterPillKey));
  return [...new Set(keys)];
};

export const serializeExploreMapFilterPillsParam = (
  selected: readonly ExploreMapFilterPillKey[]
): string | null => {
  if (selected.length === 0) return null;
  return [...new Set(selected)].join(',');
};

export const toggleExploreMapFilterPill = (
  selected: readonly ExploreMapFilterPillKey[],
  key: ExploreMapFilterPillKey
): ExploreMapFilterPillKey[] => {
  const set = new Set(selected);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return EXPLORE_MAP_FILTER_PILLS.map((p) => p.key).filter((k) => set.has(k));
};

const SEARCH_SCOPE_SET = new Set<ExploreSearchScopeKey>(['trips', 'spots', 'shops', 'facilities']);

export const parseExploreSearchScope = (value: string | null): ExploreSearchScopeKey | null => {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === 'venue' || key === 'venues' || key === 'spot') return 'spots';
  if (key === 'trip') return 'trips';
  if (key === 'shop') return 'shops';
  if (SEARCH_SCOPE_SET.has(key as ExploreSearchScopeKey)) return key as ExploreSearchScopeKey;
  return null;
};

export const serializeExploreSearchScope = (value: ExploreSearchScopeKey | null): string | null => value ?? null;

export const explorePanelForSearchScope = (scope: ExploreSearchScopeKey): ExplorePanel => {
  if (scope === 'spots') return 'venues';
  if (scope === 'shops') return 'shops';
  return 'activities';
};

export const desktopBrowseTabForSearchScope = (scope: ExploreSearchScopeKey): DesktopBrowseTab => {
  if (scope === 'spots') return 'venues';
  return 'activities';
};

export const pinKindForSearchScope = (scope: ExploreSearchScopeKey): ExplorePinKindFilter => {
  if (scope === 'spots') return 'places';
  if (scope === 'shops') return 'shops';
  if (scope === 'trips') return 'trips';
  return 'all';
};

export type ExploreSearchScopeCounts = Record<ExploreSearchScopeKey, number>;

export const emptyExploreSearchScopeCounts = (): ExploreSearchScopeCounts => ({
  trips: 0,
  spots: 0,
  shops: 0,
  facilities: 0,
});
