import type { MapFilterKey } from '../config/routingCatalog';
import {
  EXPLORE_PLACE_TOPIC_OPTIONS,
  aliasPlaceMapTopicToList,
} from '../explore/exploreMapTopicUrlParams';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/**
 * Places category (`listCat=venues`) — destination topics plus facility/shop URL keys.
 * Multi-select on list; wire: `filter=` / `placeTypes=` when `listCat=venues`.
 */
export type ListVenuePlaceTopicKey = 'hiking' | 'camping' | 'facilities' | 'shop' | 'others';

const LIST_VENUE_PLACE_TOPIC_ORDER: readonly ListVenuePlaceTopicKey[] = [
  'hiking',
  'camping',
  'others',
  'facilities',
  'shop',
];

export const LIST_VENUE_PLACE_TOPIC_FILTERS: ReadonlyArray<{
  key: ListVenuePlaceTopicKey;
  label: string;
  filterKey: MapFilterKey | 'facilities' | 'shops';
}> = EXPLORE_PLACE_TOPIC_OPTIONS.map((option) => ({
  key: aliasPlaceMapTopicToList(option.key),
  label: option.label,
  filterKey: option.key,
}));

export const LIST_VENUE_FACILITIES_TOPIC_SHIPPED = true;

/** Destination topic pills on Places category (Facilities is its own pill). */
export const listVenuePlaceTopicsForUi = (): typeof LIST_VENUE_PLACE_TOPIC_FILTERS =>
  LIST_VENUE_PLACE_TOPIC_FILTERS;

/** Place topic pills on list search when results are scoped to venues. */
export const browseListShowsPlaceTopicRow = (categories: readonly BrowseMainCategoryKey[]): boolean =>
  categories.includes('venues');

export const toggleListVenuePlaceTopic = (
  selected: readonly ListVenuePlaceTopicKey[],
  key: ListVenuePlaceTopicKey
): ListVenuePlaceTopicKey[] => {
  const set = new Set(selected);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return LIST_VENUE_PLACE_TOPIC_ORDER.filter((topic) => set.has(topic));
};
