import type { MapFilterKey } from '../config/routingCatalog';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/**
 * Places category (`listCat=venues`) — hiking · camping · shops (location-bounded).
 * Multi-select on list; wire: `filter=` URL param when `listCat=venues`.
 */
export type ListVenuePlaceTopicKey = 'hiking' | 'camping' | 'shop' | 'facilities' | 'others';

export const LIST_VENUE_PLACE_TOPIC_FILTERS: ReadonlyArray<{
  key: ListVenuePlaceTopicKey;
  label: string;
  filterKey: MapFilterKey | 'facilities' | 'shops';
}> = [
  { key: 'hiking', label: 'Hiking', filterKey: 'hiking' },
  { key: 'camping', label: 'Camping', filterKey: 'camping' },
  { key: 'shop', label: 'Shops', filterKey: 'shops' },
  { key: 'facilities', label: 'Facilities', filterKey: 'facilities' },
  { key: 'others', label: 'Others', filterKey: 'others' },
];

/** Facilities = future location amenities — filter TBD on `Location`. */
export const LIST_VENUE_FACILITIES_TOPIC_SHIPPED = false;

/** Topic pills on Places category (Hiking · Camping · Shops). */
export const listVenuePlaceTopicsForUi = (): typeof LIST_VENUE_PLACE_TOPIC_FILTERS =>
  LIST_VENUE_PLACE_TOPIC_FILTERS.filter((t) => t.key === 'hiking' || t.key === 'camping' || t.key === 'shop');

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
