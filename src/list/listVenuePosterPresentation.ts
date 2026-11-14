import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  formatListFeedPosterTitleLines,
  type BrowsePosterScheduleGrid,
  type ListFeedPosterTitleLines,
} from './listPosterPresentation';
import { browseCatalogEntityName } from './browse/browseCatalogLabels';
import { resolveVenueCatalogFactLabels } from './browse/venueBrowseFacts';

const emptySchedule: BrowsePosterScheduleGrid = {
  dateLabel: null,
  timeLabel: null,
  spotsLabel: null,
  priceLabel: null,
};

/** @deprecated Import from `src/list/browse/browseCatalogLabels.ts`. */
export {
  browseCatalogEntityName as resolveCatalogEntityName,
  browseCatalogRegionLabel as resolveCatalogRegionLabel,
  browseCatalogHubLabel as resolveCatalogHubLabel,
  browseCatalogHeaderLocationLine as resolveCatalogHeaderAreaLocationLine,
  browseCatalogNormalize as catalogLabelNormalize,
} from './browse/browseCatalogLabels';

/** @deprecated Import from `src/list/browse/venueBrowseFacts.ts`. */
export {
  resolveSharedPlaceFactLabels,
  resolveHikingPlaceFactLabels,
  resolveCampingPlaceFactLabels,
  resolveVenueCatalogFactLabels as resolvePlaceCatalogFactLabels,
  resolveVenueBrowseThumbnailFactLabels as resolveListVenueThumbnailFactLabels,
  resolveVenueBrowseCardFactLabels as resolveListVenueListingFactLabels,
} from './browse/venueBrowseFacts';

/** @deprecated Import from `src/list/browse/venueBrowseCardCopy.ts`. */
export {
  type VenueBrowseCardRating as ListVenueListingRating,
  resolveVenueBrowseCardRating as resolveListVenueListingRating,
  resolveVenueBrowseScheduleHint as resolveListVenueScheduleHint,
  type VenueBrowseCardCopy as ListVenueListingCopy,
  resolveVenueBrowseCardCopy as resolveListVenueListingCopy,
  resolveVenueBrowseCardCopy,
  type VenueBrowseCardCopy,
} from './browse/venueBrowseCardCopy';

/** Fact pills on place / shop posters. */
export const resolveListVenuePosterFactLabels = (card: DiscoveryCardModel): string[] =>
  resolveVenueCatalogFactLabels(card, { includeLocationSubtitle: true });

export type ListVenuePosterCopy = {
  placeLine: string | null;
  heroTitle: string;
  titleLines: ListFeedPosterTitleLines;
  schedule: BrowsePosterScheduleGrid;
  requirementLabels: string[];
};

export const resolveListVenuePosterCopy = (card: DiscoveryCardModel): ListVenuePosterCopy => {
  const heroTitle = browseCatalogEntityName(card);
  const region = card.venueRegion?.trim() || card.subtitle?.trim() || null;

  return {
    placeLine: region,
    heroTitle,
    titleLines: formatListFeedPosterTitleLines(heroTitle, 6, 3),
    schedule: emptySchedule,
    requirementLabels: resolveListVenuePosterFactLabels(card),
  };
};