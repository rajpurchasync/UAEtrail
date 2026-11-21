import {
  exploreVenueIsPlacesSpot,
  isGeographyMapSource,
  isPeekOnlyCatalogProfile,
  isTimeBoundExploreMapItem,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';

export const isMerchantShopMapItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'shop' && item.kind === 'shop' && !item.id.startsWith('product:');

/** Community-submitted gear shop pin — map peek only (not merchant profile). */
export const isCommunityShopMapItem = (item: ExploreMapItemDTO): boolean =>
  item.kind === 'shop' && isPeekOnlyCatalogProfile(item.catalogProfileExposure);

export const isShopListItem = (item: ExploreMapItemDTO): boolean =>
  isMerchantShopMapItem(item) || isCommunityShopMapItem(item);

/** Permanent catalog: trails, camp spots, shops — not outings or event venues. */
export const isPlacesMapItem = (item: ExploreMapItemDTO): boolean => {
  if (isShopListItem(item)) return true;
  if (!isGeographyMapSource(item.source)) return false;
  return exploreVenueIsPlacesSpot(item.kind, item.placeKind);
};

/** Time-bound social layer: hosted outings and looking-for posts. */
export const isBuddyMapItem = (item: ExploreMapItemDTO): boolean => isTimeBoundExploreMapItem(item);