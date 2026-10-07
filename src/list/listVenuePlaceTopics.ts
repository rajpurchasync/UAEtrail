import type { MapFilterKey } from '../config/routingCatalog';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/**
 * Places category (`listCat=venues`) — topic pills aligned with explore map venue emojis
 * (`ExploreFilterIcon` context `venue`). Multi-select on list; wire: `placeTopics` URL param (Phase 1).
 */
export type ListVenuePlaceTopicKey = 'hiking' | 'camping' | 'facilities' | 'others';

export const LIST_VENUE_PLACE_TOPIC_FILTERS: ReadonlyArray<{
  key: ListVenuePlaceTopicKey;
  label: string;
  /** Map filter for emoji resolution; `facilities` uses dedicated emoji until location amenities ship. */
  filterKey: MapFilterKey | 'facilities';
}> = [
  { key: 'hiking', label: 'Hiking', filterKey: 'hiking' },
  { key: 'camping', label: 'Camping', filterKey: 'camping' },
  { key: 'facilities', label: 'Facilities', filterKey: 'facilities' },
  { key: 'others', label: 'Others', filterKey: 'others' },
];

/** Facilities = future location amenities (toilets, grocery, shop at trailhead, etc.) — filter TBD on `Location`. */
export const LIST_VENUE_FACILITIES_TOPIC_SHIPPED = false;

/** Topic pills shown in Places category UI (Facilities omitted until amenities ship). */
export const listVenuePlaceTopicsForUi = (): typeof LIST_VENUE_PLACE_TOPIC_FILTERS =>
  LIST_VENUE_FACILITIES_TOPIC_SHIPPED
    ? LIST_VENUE_PLACE_TOPIC_FILTERS
    : LIST_VENUE_PLACE_TOPIC_FILTERS.filter((t) => t.key !== 'facilities');

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
