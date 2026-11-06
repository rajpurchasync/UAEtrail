import type { MapFilterKey } from '../config/routingCatalog';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/**
 * Places category (`listCat=venues`) — trail · camping · facilities · shopping · other.
 * Multi-select on list; wire: `filter=` URL param when `listCat=venues`.
 */
export type ListVenuePlaceTopicKey = 'hiking' | 'camping' | 'facilities' | 'shop' | 'others';

export const LIST_VENUE_PLACE_TOPIC_FILTERS: ReadonlyArray<{
  key: ListVenuePlaceTopicKey;
  label: string;
  filterKey: MapFilterKey | 'facilities' | 'shops';
}> = [
  { key: 'hiking', label: 'Trail', filterKey: 'hiking' },
  { key: 'camping', label: 'Camping', filterKey: 'camping' },
  { key: 'facilities', label: 'Facilities', filterKey: 'facilities' },
  { key: 'shop', label: 'Shopping', filterKey: 'shops' },
  { key: 'others', label: 'Other', filterKey: 'others' },
];

export const LIST_VENUE_FACILITIES_TOPIC_SHIPPED = true;

/** Topic pills on Places category. */
export const listVenuePlaceTopicsForUi = (): typeof LIST_VENUE_PLACE_TOPIC_FILTERS =>
  LIST_VENUE_PLACE_TOPIC_FILTERS.filter((t) => t.key !== 'facilities' || LIST_VENUE_FACILITIES_TOPIC_SHIPPED);

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
  return LIST_VENUE_PLACE_TOPIC_FILTERS.map((t) => t.key).filter((k) => set.has(k));
};
