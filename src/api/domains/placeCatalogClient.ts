import type { PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityPickerType } from '../../config/activityTypes';
import { apiRequest } from '../client';

/** Query for place catalog reads (Host picker, publishing workspace). */
export type PlaceCatalogQuery = {
  placeType?: ActivityPickerType;
  countryCode?: string;
};

/**
 * Place catalog read — canonical `GET /places/catalog` (places only; no facilities).
 * Legacy `/places/registry` remains a server alias during CPC.
 */
export const fetchPlaceCatalog = async (
  query: PlaceCatalogQuery = {}
): Promise<PlaceDTO[]> => {
  const params = new URLSearchParams();
  if (query.placeType) params.set('activityType', query.placeType);
  if (query.countryCode) params.set('countryCode', query.countryCode);
  const qs = params.toString();
  const response = await apiRequest<{ data: PlaceDTO[] }>(
    `/places/catalog${qs ? `?${qs}` : ''}`,
    { auth: true }
  );
  return response.data;
};
