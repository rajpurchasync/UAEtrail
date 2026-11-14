/** @deprecated Import from `src/list/browse/*` — see `venueBrowseCardCopy`, `venueBrowseFacts`, `browseCatalogLabels`. */
export {
  browseCatalogEntityName as resolveCatalogEntityName,
  browseCatalogRegionLabel as resolveCatalogRegionLabel,
  browseCatalogHubLabel as resolveCatalogHubLabel,
  browseCatalogHeaderLocationLine as resolveCatalogHeaderAreaLocationLine,
  browseCatalogNormalize as catalogLabelNormalize,
} from './browse/browseCatalogLabels';

export {
  resolveSharedPlaceFactLabels,
  resolveHikingPlaceFactLabels,
  resolveCampingPlaceFactLabels,
  resolveVenueCatalogFactLabels as resolvePlaceCatalogFactLabels,
  resolveVenueBrowseThumbnailFactLabels as resolveListVenueThumbnailFactLabels,
  resolveVenueBrowseCardFactLabels as resolveListVenueListingFactLabels,
} from './browse/venueBrowseFacts';

export {
  type VenueBrowseCardRating as ListVenueListingRating,
  resolveVenueBrowseCardRating as resolveListVenueListingRating,
  resolveVenueBrowseScheduleHint as resolveListVenueScheduleHint,
  type VenueBrowseCardCopy as ListVenueListingCopy,
  resolveVenueBrowseCardCopy as resolveListVenueListingCopy,
  resolveVenueBrowseCardCopy,
  type VenueBrowseCardCopy,
  type VenueBrowsePosterCopy as ListVenuePosterCopy,
  resolveVenueBrowsePosterCopy as resolveListVenuePosterCopy,
  resolveVenueBrowsePosterFactLabels as resolveListVenuePosterFactLabels,
} from './browse/venueBrowseCardCopy';