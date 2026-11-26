import {
  isFacilityMapSource,
  isFacilityPlaceKind,
  isGeographyMapSource,
  isTimeBoundExploreMapItem,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { BROWSE_LIST_CATEGORY_PLACES } from '../../place/geographyVocabulary';
import {
  parseExploreMapFilterPillsParam,
  serializeExploreMapFilterPillsParam,
  type ExploreMapFilterPillKey,
} from '../../discovery/discoveryPortExploreRuntime';
import { PRODUCT_CREWS_TAB_LABEL } from '../../content/productNorthStar';

/**
 * List main categories — activities, places, crews (people), agencies.
 */
export type BrowseMainCategoryKey = 'activities' | 'venues' | 'people' | 'agencies';

const isFacilityBrowseItem = (item: ExploreMapItemDTO): boolean =>
  isFacilityMapSource(item.source) || Boolean(item.placeKind && isFacilityPlaceKind(item.placeKind));

/** Trails, camps, outdoor venues, and gear shops — not amenity POIs. */
export const mapItemMatchesBrowsePlacesCategory = (item: ExploreMapItemDTO): boolean => {
  if (isFacilityBrowseItem(item)) return false;
  return isGeographyMapSource(item.source) || item.source === 'shop';
};

const isAgencyBrandItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'agency' &&
  (item.path.includes('/agency/') || item.path.includes('/partner/'));

/** Time-bound map rows — hosted activities + availability pins. */
export const mapItemMatchesBrowseActivitiesCategory = (item: ExploreMapItemDTO): boolean =>
  isTimeBoundExploreMapItem(item);

export const mapItemMatchesBrowseMainCategory = (
  item: ExploreMapItemDTO,
  key: BrowseMainCategoryKey
): boolean => {
  switch (key) {
    case 'activities':
      return mapItemMatchesBrowseActivitiesCategory(item);
    case BROWSE_LIST_CATEGORY_PLACES:
      return mapItemMatchesBrowsePlacesCategory(item);
    case 'people':
      return false;
    case 'agencies':
      return isAgencyBrandItem(item);
    default:
      return false;
  }
};

export const mapItemMatchesBrowseMainCategories = (
  item: ExploreMapItemDTO,
  categories: readonly BrowseMainCategoryKey[]
): boolean => {
  if (categories.length === 0) return true;
  return categories.some((key) => mapItemMatchesBrowseMainCategory(item, key));
};

export const parseBrowseMainCategoriesFromTopics = (
  topicsParam: string | null
): BrowseMainCategoryKey[] => {
  const pills = parseExploreMapFilterPillsParam(topicsParam);
  const keys = new Set<BrowseMainCategoryKey>();
  for (const pill of pills) {
    if (pill === 'trips') keys.add('activities');
    if (pill === 'spots' || pill === 'shops') keys.add(BROWSE_LIST_CATEGORY_PLACES);
  }
  return [...keys];
};

export const serializeBrowseMainCategoriesToTopics = (
  categories: readonly BrowseMainCategoryKey[]
): string | null => {
  const pills: ExploreMapFilterPillKey[] = [];
  if (categories.includes('activities')) {
    pills.push('trips');
  }
  if (categories.includes(BROWSE_LIST_CATEGORY_PLACES)) {
    pills.push('spots', 'shops');
  }
  return serializeExploreMapFilterPillsParam(pills);
};

export const BROWSE_MAIN_CATEGORY_LABELS: ReadonlyArray<{ key: BrowseMainCategoryKey; label: string }> = [
  { key: 'activities', label: 'Activities' },
  { key: BROWSE_LIST_CATEGORY_PLACES, label: 'Places' },
  { key: 'people', label: PRODUCT_CREWS_TAB_LABEL },
  { key: 'agencies', label: 'Agencies' },
];
