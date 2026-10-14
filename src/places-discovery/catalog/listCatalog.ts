import { isTimeBoundExploreMapItem, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreActivities, sortExploreVenues } from '../../explore/exploreListSort';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';

/** Place/shop/agency rows in full-screen list discovery (broader than map `isPlacesMapItem`). */
export const isListCatalogPlaceItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'venue' || item.source === 'shop' || item.source === 'agency';

/** Region chip — activities pass through; catalog places must match. */
export const filterListCatalogByVenueRegions = (
  items: ExploreMapItemDTO[],
  venueRegions: string[]
): ExploreMapItemDTO[] => {
  if (venueRegions.length === 0) return items;
  return items.filter((item) => {
    if (isListCatalogPlaceItem(item)) {
      return venueItemMatchesRegions(item, venueRegions);
    }
    return true;
  });
};

/** Sort merge: scheduled outings first, then venues/shops (list feed order). */
export const mergeListCatalogPlansAndPlaces = (pool: ExploreMapItemDTO[]): ExploreMapItemDTO[] => {
  const plans = pool.filter((item) => isTimeBoundExploreMapItem(item));
  const places = pool.filter(isListCatalogPlaceItem);
  return [...sortExploreActivities(plans), ...sortExploreVenues(places)];
};
