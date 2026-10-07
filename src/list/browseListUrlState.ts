import {
  parseExploreActivityDatePreset,
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '../explore/exploreActivityDateFilter';
import { parseMapFilter, type MapFilterKey } from '../explore/routing';
import { parseVenueRegionsParam } from '../explore/routing';
import type { BrowseListFilterState, BrowsePriceFilter, BrowseWhenFilter } from './browseListFilters';
import {
  parseBrowseMainCategoriesFromTopics,
  serializeBrowseMainCategoriesToTopics,
  type BrowseMainCategoryKey,
} from './browseListTaxonomy';

const PRICE_PARAM = 'price';
const WHEN_PARAM = 'when';

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

const parseTripTopic = (filterParam: string | null): { tripTopic: MapFilterKey; tripLookingOnly: boolean } => {
  if (filterParam === 'looking') return { tripTopic: 'all', tripLookingOnly: true };
  const parsed = parseMapFilter(filterParam);
  if (parsed === 'hiking' || parsed === 'camping' || parsed === 'rideshare') {
    return { tripTopic: parsed, tripLookingOnly: false };
  }
  return { tripTopic: 'all', tripLookingOnly: false };
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

  return {
    query: searchParams.get('q')?.trim() ?? '',
    categories: parseBrowseMainCategoriesFromTopics(searchParams.get('topics')),
    ...parseTripTopic(searchParams.get('filter')),
    price: parseBrowseListPriceParam(searchParams.get(PRICE_PARAM)),
    when: whenNormalized,
    activityDatePreset,
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
  } else if (state.tripTopic !== 'all') {
    params.set('filter', state.tripTopic);
  }

  const price = serializeBrowseListPriceParam(state.price);
  if (price) params.set(PRICE_PARAM, price);

  const dateSerialized = serializeExploreActivityDatePreset(state.activityDatePreset);
  if (dateSerialized) params.set('date', dateSerialized);

  if (state.when === 'weekend') {
    params.set(WHEN_PARAM, 'weekend');
  }

  if (regions.length > 0) params.set('regions', regions.join(','));

  return params;
};

/** Params shared with `/explore` map browse (drops list-only keys where needed). */
export const serializeBrowseListToExploreSearchParams = (
  state: BrowseListFilterState,
  regions: string[]
): URLSearchParams => {
  const params = serializeBrowseListSearchParams(state, regions);
  params.delete(PRICE_PARAM);
  if (state.when === 'weekend') {
    params.delete(WHEN_PARAM);
    params.delete('date');
  }
  return params;
};

export type { BrowseMainCategoryKey };
