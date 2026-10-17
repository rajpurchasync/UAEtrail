import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { selectSeekingActivitiesForListCatalog } from '@/activity-discovery/catalog/listSeeking';
import {
  filterListCatalogByVenueRegions,
  mergeListCatalogPlansAndPlaces,
} from '@/places-discovery/catalog/listCatalog';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import {
  matchesActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../explore/exploreActivityDateFilter';
import { exploreItemMatchesQuery } from '../explore/exploreSearchMatches';
import { matchesUnifiedTopicFilter } from '../explore/ui/exploreMapPinModel';
import { resolveExploreItemScheduleDate } from '../explore/ui/exploreMapPinModel';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { mapItemMatchesBrowseMainCategories } from './browseListTaxonomy';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import { matchesListVenuePlaceTopic } from './listVenuePlaceTopicFilter';
import type { ListVenuePlaceTopicKey } from './listVenuePlaceTopics';
import type { BuddiesDiscoverySegment } from './buddiesDiscoverySegment';
/** @deprecated Use BrowseMainCategoryKey — kept for imports migrating */
export type BrowseCategoryKey = BrowseMainCategoryKey;

export type BrowsePriceFilter = 'all' | 'free' | 'paid';

export type BrowseWhenFilter = 'any' | 'week' | 'weekend';

export type BrowseListFilterState = {
  query: string;
  /** Main buckets: Trips (activity + demand) · Venues · Shops */
  categories: BrowseMainCategoryKey[];
  /** Hosted trip topics — empty = all; OR match when multiple selected. */
  tripTopics: BrowseTripTopicKey[];
  /** Demand-only — explore pin kind `looking` (`filter=looking`). */
  tripLookingOnly: boolean;
  /** Places category — hiking · camping · others (see `listVenuePlaceTopics.ts`). */
  placeTopics: ListVenuePlaceTopicKey[];
  price: BrowsePriceFilter;
  when: BrowseWhenFilter;
  /** Aligns with explore map `?date=` (today · tomorrow · week · month). */
  activityDatePreset: ExploreActivityDatePreset;
  /** Buddies list category — who's going · looking for · followed. */
  buddiesSegment: BuddiesDiscoverySegment;
};

export const BROWSE_PRICE_OPTIONS: ReadonlyArray<{ key: BrowsePriceFilter; label: string }> = [
  { key: 'all', label: 'All prices' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
];

export const BROWSE_WHEN_OPTIONS: ReadonlyArray<{ key: BrowseWhenFilter; label: string }> = [
  { key: 'any', label: 'Any time' },
  { key: 'weekend', label: 'Weekend outings' },
];

const cardMatchesPrice = (card: ExploreCardModel, price: BrowsePriceFilter): boolean => {
  if (price === 'all') return true;
  const badge = card.price?.badge?.toLowerCase() ?? '';
  if (price === 'free') return badge.startsWith('free') || !card.price;
  if (price === 'paid') return badge.includes('paid') || badge.includes('aed') || badge.includes('shared');
  return true;
};

export const cardMatchesBrowsePrice = cardMatchesPrice;

const matchesWeekendBrowseFilter = (item: ExploreMapItemDTO): boolean => {
  if (isGeographyMapSource(item.source) || item.source === 'shop' || item.source === 'agency') return true;
  const schedule = resolveExploreItemScheduleDate(item);
  if (!schedule) return false;
  const day = new Date(`${schedule}T12:00:00`).getDay();
  return day === 5 || day === 6 || day === 0;
};

/** Client filter — explore topic pills + unified trip topic + list price/when. */
export const filterExploreMapItemsForList = (
  items: ExploreMapItemDTO[],
  state: BrowseListFilterState,
  venueRegions: string[]
): ExploreMapItemDTO[] => {
  let pool = items;

  if (state.categories.length > 0) {
    pool = pool.filter((item) => mapItemMatchesBrowseMainCategories(item, state.categories));
  }

  const tripsCategoryInScope =
    state.categories.length === 0 || state.categories.includes('activities');
  const placesCategoryInScope =
    state.categories.length === 0 || state.categories.includes('venues');

  if (tripsCategoryInScope && state.tripLookingOnly) {
    pool = selectSeekingActivitiesForListCatalog(pool);
  } else if (tripsCategoryInScope && state.tripTopics.length > 0) {
    pool = pool.filter((item) =>
      state.tripTopics.some((topic) => matchesUnifiedTopicFilter(item, topic, 'all', 'all'))
    );
  }

  if (placesCategoryInScope && state.placeTopics.length > 0) {
    pool = pool.filter((item) => {
      if (!isGeographyMapSource(item.source) && item.source !== 'shop') return false;
      return state.placeTopics.some((topic) => matchesListVenuePlaceTopic(item, topic));
    });
  }

  if (state.query.trim()) {
    pool = pool.filter((item) => exploreItemMatchesQuery(item, state.query));
  }

  if (state.activityDatePreset !== 'anyday') {
    pool = pool.filter((item) => matchesActivityDateFilter(item, state.activityDatePreset));
  }
  if (state.when === 'weekend') {
    pool = pool.filter(matchesWeekendBrowseFilter);
  }

  pool = filterListCatalogByVenueRegions(pool, venueRegions);

  return mergeListCatalogPlansAndPlaces(pool);
};
