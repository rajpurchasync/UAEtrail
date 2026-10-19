import {
  exploreMapItemIsSeeking,
  isGeographyMapSource,
  isTimeBoundExploreMapItem,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import {
  EXPLORE_SEARCH_SCOPE_BUDDIES_DESCRIPTION,
  EXPLORE_SEARCH_SCOPE_BUDDIES_LABEL,
} from '../content/explorePeopleBrowseCopy';
import type { ExplorePanel } from './routing';
import { MAP_LENS_SPOTS_LABEL } from '../place/geographyVocabulary';
import type { ExplorePinKindFilter } from './explorePinKindFilter';
import type { DesktopBrowseTab } from './ui/exploreBrowsePanelCopy';

/**
 * Canonical explore browse taxonomy — map pills + search scopes.
 * @see docs/CREATE_FLOW.md · docs/SYSTEM_COHERENCE.md §6
 */

export const EXPLORE_SEARCH_PROMPT = 'What are you looking for?';

export const EXPLORE_SEARCH_OPEN_PLACEHOLDER = 'Activities, places, people, shops…';

/** Map chrome — multi-select filter pills. */
export type ExploreMapFilterPillKey = 'trips' | 'looking' | 'spots' | 'shops';

/** Map multi-select pills — seeking rolls into **Activities** (M0); `looking` key kept for legacy `topics=` parse. */
export const EXPLORE_MAP_FILTER_PILLS: ReadonlyArray<{ key: ExploreMapFilterPillKey; label: string }> = [
  { key: 'trips', label: 'Activities' },
  { key: 'spots', label: MAP_LENS_SPOTS_LABEL },
  { key: 'shops', label: 'Shops' },
];

/** Search commit scopes — URL `searchScope=` (legacy `trips` / `spots` parsed in {@link parseExploreSearchScope}). */
export type ExploreSearchScopeKey =
  | 'activities'
  | 'places'
  | 'people'
  | 'shops'
  | 'agencies'
  | 'facilities';

export const EXPLORE_SEARCH_SCOPE_UI_ORDER: readonly ExploreSearchScopeKey[] = [
  'activities',
  'places',
  'people',
  'shops',
  'agencies',
];

export const EXPLORE_SEARCH_SCOPES_SHIPPED: readonly ExploreSearchScopeKey[] = [
  'activities',
  'places',
  'people',
  'shops',
  'agencies',
];

export const EXPLORE_SEARCH_SCOPE_COPY: Record<
  ExploreSearchScopeKey,
  { label: string; description: string; shipped: boolean }
> = {
  activities: {
    label: 'Activities',
    description: 'Hosted hikes, camps, rideshares, events',
    shipped: true,
  },
  places: {
    label: 'Places',
    description: 'Trails, camps, outdoor venues',
    shipped: true,
  },
  people: {
    label: EXPLORE_SEARCH_SCOPE_BUDDIES_LABEL,
    description: EXPLORE_SEARCH_SCOPE_BUDDIES_DESCRIPTION,
    shipped: true,
  },
  shops: {
    label: 'Shops',
    description: 'Gear and outdoor shops',
    shipped: true,
  },
  agencies: {
    label: 'Agencies',
    description: 'Tour operators on hosted activities (no map pin)',
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

/** Agency storefronts are not map pins — match hosted activities they publish. */
export const mapItemIsAgencyHostedActivity = (item: ExploreMapItemDTO): boolean =>
  item.source === 'activity' &&
  item.activityMode !== 'seeking' &&
  item.activity?.publishingProfileKind === 'agency';

/** Hosted + seeking time-bound plans (unified activity pins). */
export const mapItemMatchesTripsPill = (item: ExploreMapItemDTO): boolean =>
  isTimeBoundExploreMapItem(item);

export const mapItemMatchesLookingPill = (item: ExploreMapItemDTO): boolean => exploreMapItemIsSeeking(item);

/** Catalog venues (trails, camps, places) — not shops. */
export const mapItemMatchesSpotsPill = (item: ExploreMapItemDTO): boolean =>
  isGeographyMapSource(item.source) && !isShopPin(item);

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
    case 'activities':
      return mapItemMatchesTripsPill(item);
    case 'places':
      return mapItemMatchesSpotsPill(item);
    case 'people':
      return false;
    case 'shops':
      return mapItemMatchesShopsPill(item);
    case 'agencies':
      return mapItemIsAgencyHostedActivity(item);
    case 'facilities':
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
  looking: 'trips',
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

const SEARCH_SCOPE_SET = new Set<ExploreSearchScopeKey>([
  'activities',
  'places',
  'people',
  'shops',
  'agencies',
  'facilities',
]);

export const parseExploreSearchScope = (value: string | null): ExploreSearchScopeKey | null => {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === 'trips' || key === 'trip' || key === 'activity' || key === 'activities') return 'activities';
  if (key === 'spots' || key === 'spot' || key === 'venue' || key === 'venues' || key === 'place' || key === 'places')
    return 'places';
  if (key === 'looking' || key === 'demand' || key === 'people' || key === 'person') return 'people';
  if (key === 'shop' || key === 'shops') return 'shops';
  if (key === 'agency' || key === 'agencies' || key === 'operator' || key === 'operators') return 'agencies';
  if (SEARCH_SCOPE_SET.has(key as ExploreSearchScopeKey)) return key as ExploreSearchScopeKey;
  return null;
};

export const serializeExploreSearchScope = (value: ExploreSearchScopeKey | null): string | null => value ?? null;

export const explorePanelForSearchScope = (scope: ExploreSearchScopeKey): ExplorePanel => {
  if (scope === 'places') return 'venues';
  if (scope === 'shops' || scope === 'agencies') return 'shops';
  return 'activities';
};

export const desktopBrowseTabForSearchScope = (scope: ExploreSearchScopeKey): DesktopBrowseTab => {
  if (scope === 'places' || scope === 'shops' || scope === 'agencies') return 'venues';
  return 'activities';
};

export const pinKindForSearchScope = (scope: ExploreSearchScopeKey): ExplorePinKindFilter => {
  if (scope === 'places') return 'places';
  if (scope === 'shops' || scope === 'agencies') return 'shops';
  if (scope === 'activities') return 'activities';
  if (scope === 'people') return 'all';
  return 'all';
};

export type ExploreSearchScopeCounts = Record<ExploreSearchScopeKey, number>;

export const emptyExploreSearchScopeCounts = (): ExploreSearchScopeCounts => ({
  activities: 0,
  places: 0,
  people: 0,
  shops: 0,
  agencies: 0,
  facilities: 0,
});
