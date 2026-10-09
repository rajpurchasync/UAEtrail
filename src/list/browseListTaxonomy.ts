import { isTimeBoundExploreMapItem, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreMapFilterPillKey } from '../explore/exploreBrowseTaxonomy';
import {
  parseExploreMapFilterPillsParam,
  serializeExploreMapFilterPillsParam,
} from '../explore/exploreBrowseTaxonomy';

/**
 * List main categories — same mental model as explore **activities** list:
 * hosted trips + participant demand = **Trips** (`useExploreBrowseList` plans pool).
 *
 * Map URL still uses `topics=trips,looking` when Trips is selected so `/explore` matches.
 * @see docs/experiment/explore-browse-ia.md (Plans = Organize + Demand)
 */
export type BrowseMainCategoryKey = 'trips' | 'venues' | 'people' | 'guides' | 'agencies';

/** Location-bounded catalog pins — trails, camps, outdoor venues, and gear shops. */
export const mapItemMatchesBrowsePlacesCategory = (item: ExploreMapItemDTO): boolean =>
  item.source === 'venue' || item.source === 'shop';

const isGuideBrandItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'agency' && item.path.includes('/guide/');

const isAgencyBrandItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'agency' &&
  (item.path.includes('/agency/') || item.path.includes('/partner/'));

/** Plans layer — activity + demand (not a separate list bucket). */
export const mapItemMatchesBrowseTripsCategory = (item: ExploreMapItemDTO): boolean =>
  isTimeBoundExploreMapItem(item);

export const mapItemMatchesBrowseMainCategory = (
  item: ExploreMapItemDTO,
  key: BrowseMainCategoryKey
): boolean => {
  switch (key) {
    case 'trips':
      return mapItemMatchesBrowseTripsCategory(item);
    case 'venues':
      return mapItemMatchesBrowsePlacesCategory(item);
    case 'people':
      return false;
    case 'guides':
      return isGuideBrandItem(item);
    case 'agencies':
      return isAgencyBrandItem(item) || (item.source === 'agency' && !isGuideBrandItem(item));
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
    if (pill === 'trips' || pill === 'looking') keys.add('trips');
    if (pill === 'spots' || pill === 'shops') keys.add('venues');
  }
  return [...keys];
};

export const serializeBrowseMainCategoriesToTopics = (
  categories: readonly BrowseMainCategoryKey[]
): string | null => {
  const pills: ExploreMapFilterPillKey[] = [];
  if (categories.includes('trips')) {
    pills.push('trips', 'looking');
  }
  if (categories.includes('venues')) {
    pills.push('spots', 'shops');
  }
  return serializeExploreMapFilterPillsParam(pills);
};

/** @deprecated Use {@link mapItemMatchesBrowseMainCategories} */
export const browseMainCategoriesToTopicPills = (
  categories: readonly BrowseMainCategoryKey[]
): ExploreMapFilterPillKey[] => {
  const pills: ExploreMapFilterPillKey[] = [];
  if (categories.includes('trips')) pills.push('trips', 'looking');
  if (categories.includes('venues')) {
    pills.push('spots', 'shops');
  }
  return pills;
};

export const BROWSE_MAIN_CATEGORY_LABELS: ReadonlyArray<{ key: BrowseMainCategoryKey; label: string }> = [
  { key: 'trips', label: 'Activities' },
  { key: 'venues', label: 'Places' },
  { key: 'people', label: 'Buddies' },
  { key: 'guides', label: 'Guides' },
  { key: 'agencies', label: 'Agencies' },
];
