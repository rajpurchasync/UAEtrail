import type { ActivityDTO, LocationDTO, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { api } from './services';
import type { Place } from '../types/place';
import { mapLocationToPlace } from './mappers/place';
import { fetchPlaceEntity } from './entities';

export { mapLocationToPlace } from './mappers/place';
export { fetchEntity, fetchPlaceEntity } from './entities';
export type { EntityFetchResult } from './entities';

const isVenueActivityType = (activityType: LocationDTO['activityType']) =>
  activityType === 'hiking' || activityType === 'camping' || activityType === 'event';

const mapLocationsToPlaces = (locations: LocationDTO[]): Place[] =>
  locations.filter((item) => isVenueActivityType(item.activityType)).map(mapLocationToPlace);

export const fetchPublicPlaces = async (countryCode?: string): Promise<Place[]> => {
  const response = await api.getPublicPlaces(countryCode);
  return mapLocationsToPlaces(response.data);
};

export const fetchApiActivities = async (when: 'upcoming' | 'past' = 'upcoming'): Promise<ActivityDTO[]> => {
  const events = await api.getPublicActivities({ when, pageSize: 100 });
  return events.data;
};

/** Canonical place detail fetch. */
export const fetchPlaceDetail = async (
  id: string
): Promise<{ place: Place | null; premium: LocationPremiumSummaryDTO | null }> =>
  fetchPlaceEntity(id);
