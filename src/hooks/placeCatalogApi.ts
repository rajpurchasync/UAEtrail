import type { PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../config/activityTypes';
import { fetchPlaceRegistry } from '../api/domains/placeRegistry';
import { api } from '../api/index';

export const loadPlaceRegistryForPicker = async (
  activityType?: ActivityType
): Promise<PlaceDTO[]> => fetchPlaceRegistry({ placeType: activityType });

export const listPublicPlacesCatalog = async (): Promise<PlaceDTO[]> => {
  const res = await api.getPublicPlaces();
  return res.data ?? [];
};

export const submitPlaceContribution = async (
  payload: Partial<PlaceDTO>,
  tenantId?: string
): Promise<PlaceDTO> => {
  const res = tenantId
    ? await api.submitPlace(tenantId, payload)
    : await api.submitUserPlace(payload);
  return res.data;
};
