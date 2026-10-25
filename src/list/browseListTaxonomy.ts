import { isTimeBoundExploreMapItem, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { BROWSE_LIST_CATEGORY_PLACES } from '../place/geographyVocabulary';
import type { ExploreMapFilterPillKey } from '../explore/exploreBrowseTaxonomy';
import {
  parseExploreMapFilterPillsParam,
  serializeExploreMapFilterPillsParam,
} from '../explore/exploreBrowseTaxonomy';

/**
 * List main categories — **activities** (hosted + seeking), places, people, brands.
 * Map `topics` still uses explore wire `trips,looking` when activities category is selected.
 */
export type BrowseMainCategoryKey = 'activities' | 'venues' | 'people' | 'agencies';

/** Location-bounded catalog pins — trails, camps, outdoor venues, and gear shops. */
export const mapItemMatchesBrowsePlacesCategory = (item: ExploreMapItemDTO): boolean =>
  isGeographyMapSource(item.source) || item.source === 'shop';

const isAgencyBrandItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'agency' &&
  (item.path.includes('/agency/') || item.path.includes('/partner/'));

/** Time-bound map rows — hosted + seeking activities. */
export const mapItemMatchesBrowseActivitiesCategory = (item: ExploreMapItemDTO): boolean =>
  isTimeBoundExploreMapItem(item);

/** @deprecated Use {@link mapItemMatchesBrowseActivitiesCategory}. */
export const mapItemMatchesBrowseTripsCategory = mapItemMatchesBrowseActivitiesCategory;

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
    if (pill === 'trips' || pill === 'looking') keys.add('activities');
    if (pill === 'spots' || pill === 'shops') keys.add(BROWSE_LIST_CATEGORY_PLACES);
  }
  return [...keys];
};

export const serializeBrowseMainCategoriesToTopics = (
  categories: readonly BrowseMainCategoryKey[]
): string | null => {
  const pills: ExploreMapFilterPillKey[] = [];
  if (categories.includes('activities')) {
    pills.push('trips', 'looking');
  }
  if (categories.includes(BROWSE_LIST_CATEGORY_PLACES)) {
    pills.push('spots', 'shops');
  }
  return serializeExploreMapFilterPillsParam(pills);
};

/** @deprecated Use {@link mapItemMatchesBrowseMainCategories} */
export const browseMainCategoriesToTopicPills = (
  categories: readonly BrowseMainCategoryKey[]
): ExploreMapFilterPillKey[] => {
  const pills: ExploreMapFilterPillKey[] = [];
  if (categories.includes('activities')) pills.push('trips', 'looking');
  if (categories.includes(BROWSE_LIST_CATEGORY_PLACES)) {
    pills.push('spots', 'shops');
  }
  return pills;
};

export const BROWSE_MAIN_CATEGORY_LABELS: ReadonlyArray<{ key: BrowseMainCategoryKey; label: string }> = [
  { key: 'activities', label: 'Activities' },
  { key: BROWSE_LIST_CATEGORY_PLACES, label: 'Places' },
  { key: 'people', label: 'Buddies' },
  { key: 'agencies', label: 'Agencies' },
];
