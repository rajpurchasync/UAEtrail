import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import {
  matchesActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../explore/exploreActivityDateFilter';
import { exploreItemMatchesQuery } from '../explore/exploreSearchMatches';
import { sortExploreActivities, sortExploreVenues } from '../explore/exploreListSort';
import { matchesUnifiedTopicFilter } from '../explore/ui/exploreMapPinModel';
import { resolveExploreItemScheduleDate } from '../explore/ui/exploreMapPinModel';
import { venueItemMatchesRegions } from '../utils/venueRegionFilter';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { mapItemMatchesBrowseMainCategories } from './browseListTaxonomy';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import { matchesListVenuePlaceTopic } from './listVenuePlaceTopicFilter';
import type { ListVenuePlaceTopicKey } from './listVenuePlaceTopics';
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
  if (item.source === 'venue' || item.source === 'shop' || item.source === 'agency') return true;
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

  if (state.tripLookingOnly) {
    pool = pool.filter((item) => item.source === 'demand');
  } else if (state.tripTopics.length > 0) {
    pool = pool.filter((item) =>
      state.tripTopics.some((topic) => matchesUnifiedTopicFilter(item, topic, 'all', 'all'))
    );
  }

  if (state.placeTopics.length > 0) {
    pool = pool.filter((item) => {
      if (item.source !== 'venue') return true;
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

  if (venueRegions.length > 0) {
    pool = pool.filter((item) => {
      if (item.source === 'venue' || item.source === 'shop' || item.source === 'agency') {
        return venueItemMatchesRegions(item, venueRegions);
      }
      return true;
    });
  }

  const plans = pool.filter((item) => item.source === 'activity' || item.source === 'demand');
  const places = pool.filter(
    (item) => item.source === 'venue' || item.source === 'shop' || item.source === 'agency'
  );
  return [...sortExploreActivities(plans), ...sortExploreVenues(places)];
};
