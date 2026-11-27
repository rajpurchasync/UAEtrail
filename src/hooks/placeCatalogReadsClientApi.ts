/**
 * Place catalog **reads** for pickers and lists (not member submit).
 * @see docs/SYSTEM_COHERENCE.md §8.4.9
 */
import type { PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../config/activityTypes';
import {
  fetchPlaceCatalog,
  type PlaceCatalogQuery,
} from '../api/domains/placeCatalogClient';

export type { PlaceCatalogQuery };
export { fetchPlaceCatalog };

export const fetchPlaceCatalogRows = (
  query: PlaceCatalogQuery = {}
): Promise<PlaceDTO[]> => fetchPlaceCatalog(query);

export const loadPlaceCatalogForPicker = async (
  activityType?: ActivityType
): Promise<PlaceDTO[]> =>
  fetchPlaceCatalogRows({
    placeType: activityType === 'rideshare' ? undefined : activityType,
  });
