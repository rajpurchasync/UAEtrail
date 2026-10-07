import {
  parseExploreActivityDatePreset,
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '../explore/exploreActivityDateFilter';
import { parseMapFilter, type MapFilterKey } from '../explore/routing';
import { parseVenueRegionsParam } from '../explore/routing';
import type { BrowseListFilterState, BrowsePriceFilter, BrowseWhenFilter } from './browseListFilters';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import { isListVenuePlaceTopicKey } from './listVenuePlaceTopicFilter';
import type { ListVenuePlaceTopicKey } from './listVenuePlaceTopics';
import {
  parseBrowseMainCategoriesFromTopics,
  serializeBrowseMainCategoriesToTopics,
  type BrowseMainCategoryKey,
} from './browseListTaxonomy';
import {
  BUDDIES_SEGMENT_URL_PARAM,
  parseBuddiesDiscoverySegment,
  serializeBuddiesDiscoverySegment,
} from './buddiesDiscoverySegment';

const PRICE_PARAM = 'price';
const WHEN_PARAM = 'when';

/** List-only: dedicated category page (decoupled from map `topics` pills). */
export const LIST_CAT_PARAM = 'listCat';

export const parseListCatParam = (value: string | null): BrowseMainCategoryKey | null => {
  if (value === 'shops') return 'venues';
  if (
    value === 'trips' ||
    value === 'venues' ||
    value === 'people' ||
    value === 'guides' ||
    value === 'agencies'
  ) {
    return value;
  }
  return null;
};

export const parseBrowseListPriceParam = (value: string | null): BrowsePriceFilter => {
  if (value === 'free' || value === 'paid') return value;
  return 'all';
};

export const serializeBrowseListPriceParam = (price: BrowsePriceFilter): string | null =>
  price === 'all' ? null : price;

export const parseBrowseListWhenParam = (
  whenParam: string | null,
  dateParam: string | null
): BrowseWhenFilter => {
  if (whenParam === 'weekend') return 'weekend';
  if (whenParam === 'week') return 'week';
  const preset = parseExploreActivityDatePreset(dateParam);
  if (preset === 'week') return 'week';
  return 'any';
};

export const browseWhenToExploreDatePreset = (when: BrowseWhenFilter): ExploreActivityDatePreset => {
  if (when === 'week') return 'week';
  return 'anyday';
};

const isBrowseTripTopicKey = (key: MapFilterKey): key is BrowseTripTopicKey =>
  key === 'hiking' || key === 'camping' || key === 'rideshare';

const parseTripAndPlaceTopics = (
  filterParam: string | null,
  listCat: BrowseMainCategoryKey | null
): {
  tripTopics: BrowseTripTopicKey[];
  tripLookingOnly: boolean;
  placeTopics: ListVenuePlaceTopicKey[];
} => {
  if (!filterParam || filterParam === 'all') {
    return { tripTopics: [], tripLookingOnly: false, placeTopics: [] };
  }
  if (filterParam === 'looking') {
    return { tripTopics: [], tripLookingOnly: true, placeTopics: [] };
  }

  const tripTopics: BrowseTripTopicKey[] = [];
  const placeTopics: ListVenuePlaceTopicKey[] = [];
  const venuesContext = listCat === 'venues';

  for (const part of filterParam.split(',')) {
    const trimmed = part.trim();
    const parsed = parseMapFilter(trimmed);
    if (venuesContext) {
      if (isListVenuePlaceTopicKey(trimmed) && !placeTopics.includes(trimmed)) {
        placeTopics.push(trimmed);
      }
      continue;
    }
    if (isBrowseTripTopicKey(parsed) && !tripTopics.includes(parsed)) {
      tripTopics.push(parsed);
    }
    if (isListVenuePlaceTopicKey(trimmed) && !placeTopics.includes(trimmed)) {
      placeTopics.push(trimmed);
    }
  }
  return { tripTopics, tripLookingOnly: false, placeTopics };
};

const resolveBrowseActivityDatePreset = (
  whenParam: string | null,
  dateParam: string | null
): ExploreActivityDatePreset => {
  const fromDate = parseExploreActivityDatePreset(dateParam);
  if (fromDate !== 'anyday') return fromDate;
  if (whenParam === 'week' || parseBrowseListWhenParam(whenParam, dateParam) === 'week') {
    return 'week';
  }
  return 'anyday';
};

export const parseBrowseListFilterState = (
  searchParams: Pick<URLSearchParams, 'get'>
): BrowseListFilterState => {
  const whenParam = searchParams.get(WHEN_PARAM);
  const dateParam = searchParams.get('date');
  const when = parseBrowseListWhenParam(whenParam, dateParam);
  const activityDatePreset = resolveBrowseActivityDatePreset(whenParam, dateParam);
  const whenNormalized = when === 'week' && activityDatePreset === 'week' ? 'any' : when;
  const rawListCat = searchParams.get(LIST_CAT_PARAM);
  const listCat = parseListCatParam(rawListCat);
  const topicParse = parseTripAndPlaceTopics(searchParams.get('filter'), listCat);
  const placeTopics =
    rawListCat === 'shops' && !topicParse.placeTopics.includes('shop')
      ? [...topicParse.placeTopics, 'shop' as const]
      : topicParse.placeTopics;

  return {
    query: searchParams.get('q')?.trim() ?? '',
    categories: parseBrowseMainCategoriesFromTopics(searchParams.get('topics')),
    ...topicParse,
    placeTopics,
    price: parseBrowseListPriceParam(searchParams.get(PRICE_PARAM)),
    when: whenNormalized,
    activityDatePreset,
    buddiesSegment: parseBuddiesDiscoverySegment(searchParams.get(BUDDIES_SEGMENT_URL_PARAM)),
  };
};

export const parseBrowseListVenueRegions = (
  searchParams: Pick<URLSearchParams, 'get'>
): string[] => parseVenueRegionsParam(searchParams);

export const serializeBrowseListSearchParams = (
  state: BrowseListFilterState,
  regions: string[]
): URLSearchParams => {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set('q', state.query.trim());

  const topics = serializeBrowseMainCategoriesToTopics(state.categories);
  if (topics) params.set('topics', topics);

  if (state.tripLookingOnly) {
    params.set('filter', 'looking');
  } else if (state.tripTopics.length > 0) {
    params.set('filter', state.tripTopics.join(','));
  } else if (state.placeTopics.length > 0) {
    params.set('filter', state.placeTopics.join(','));
  }

  const price = serializeBrowseListPriceParam(state.price);
  if (price) params.set(PRICE_PARAM, price);

  const dateSerialized = serializeExploreActivityDatePreset(state.activityDatePreset);
  if (dateSerialized) params.set('date', dateSerialized);

  if (state.when === 'weekend') {
    params.set(WHEN_PARAM, 'weekend');
  }

  if (regions.length > 0) params.set('regions', regions.join(','));

  const buddies = serializeBuddiesDiscoverySegment(state.buddiesSegment);
  if (buddies) params.set(BUDDIES_SEGMENT_URL_PARAM, buddies);

  return params;
};

/** Re-export — implementation in `browseListMapHandoff.ts` (map pinKind + listCat stripping). */
export { serializeBrowseListToExploreSearchParams } from './browseListMapHandoff';

export type { BrowseMainCategoryKey };
