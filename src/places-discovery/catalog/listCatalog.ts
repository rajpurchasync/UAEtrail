import {
  isFacilityMapSource,
  isFacilityPlaceKind,
  isGeographyMapSource,
  isTimeBoundExploreMapItem,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import {
  sortExploreActivities,
  sortExploreVenues,
} from '../../discovery/discoveryPortExploreListSort';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';

const isFacilityCatalogItem = (item: ExploreMapItemDTO): boolean =>
  isFacilityMapSource(item.source) || Boolean(item.placeKind && isFacilityPlaceKind(item.placeKind));

/** Place/shop/agency rows in list discovery — amenities are chips on parent places, not rows. */
export const isListCatalogPlaceItem = (item: ExploreMapItemDTO): boolean => {
  if (isFacilityCatalogItem(item)) return false;
  return isGeographyMapSource(item.source) || item.source === 'shop' || item.source === 'agency';
};

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
export const mergeListCatalogPlansAndPlaces = (
  pool: ExploreMapItemDTO[],
  venueRegionOrder?: readonly string[]
): ExploreMapItemDTO[] => {
  const plans = pool.filter((item) => isTimeBoundExploreMapItem(item));
  const places = pool.filter(isListCatalogPlaceItem);
  return [...sortExploreActivities(plans), ...sortExploreVenues(places, venueRegionOrder)];
};
