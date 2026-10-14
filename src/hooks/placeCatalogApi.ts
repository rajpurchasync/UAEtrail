import type { LocationDTO, PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../config/activityTypes';
import {
  fetchPlaceRegistry,
  type PlaceRegistryQuery,
} from '../api/domains/placeRegistry';
import { api } from '../api/index';

export type { PlaceRegistryQuery };

export const fetchPlaceRegistryCatalog = (
  query: PlaceRegistryQuery = {}
): Promise<PlaceDTO[]> => fetchPlaceRegistry(query);

export const loadPlaceRegistryForPicker = async (
  activityType?: ActivityType
): Promise<PlaceDTO[]> =>
  fetchPlaceRegistryCatalog({
    placeType: activityType === 'rideshare' ? undefined : activityType,
  });

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

export const submitUserLocationContribution = async (
  payload: Partial<LocationDTO>
): Promise<LocationDTO> => {
  const res = await api.submitUserLocation(payload);
  return res.data;
};

export const fetchMySubmittedPlaces = async (): Promise<LocationDTO[]> => {
  const res = await api.getMySubmittedPlaces();
  return res.data;
};
