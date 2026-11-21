import {
  exploreMapItemIsAvailabilityCatalog,
  exploreMapItemIsSeeking,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';

/** Seeking + fixed availability rows for list browse (`tripLookingOnly`). */
export const isListDemandCatalogItem = (item: ExploreMapItemDTO): boolean =>
  exploreMapItemIsSeeking(item) || exploreMapItemIsAvailabilityCatalog(item);

export const filterListCatalogDemandItems = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] =>
  items.filter(isListDemandCatalogItem);