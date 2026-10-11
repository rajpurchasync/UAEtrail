import type { PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityPickerType } from '../../config/activityTypes';
import { apiRequest } from '../client';

/** Query for the venue place registry (catalog trails, camps, event spots). */
export type PlaceRegistryQuery = {
  placeType?: ActivityPickerType;
  countryCode?: string;
};

/**
 * Load mergeable venue places for pickers — routes through `GET /places/registry`.
 * Auth optional: published registry for guests; drafts/admin rows when signed in.
 */
export const fetchPlaceRegistry = async (
  query: PlaceRegistryQuery = {}
): Promise<PlaceDTO[]> => {
  const params = new URLSearchParams();
  if (query.placeType) params.set('activityType', query.placeType);
  if (query.countryCode) params.set('countryCode', query.countryCode);
  const qs = params.toString();
  const response = await apiRequest<{ data: PlaceDTO[] }>(
    `/places/registry${qs ? `?${qs}` : ''}`,
    { auth: true }
  );
  return response.data;
};
