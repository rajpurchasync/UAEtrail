import type { ActivityDTO, LocationDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { mapLocationToPlace } from '../api/mappers/place';
import type { Place } from '../types/place';

const isVenueActivityType = (activityType: LocationDTO['activityType']) =>
  activityType === 'hiking' || activityType === 'camping' || activityType === 'event';

const mapLocationsToPlaces = (locations: LocationDTO[]): Place[] =>
  locations.filter((item) => isVenueActivityType(item.activityType)).map(mapLocationToPlace);

export const fetchPublicPlaces = async (countryCode?: string): Promise<Place[]> => {
  const response = await api.getPublicPlaces(countryCode);
  return mapLocationsToPlaces(response.data);
};

export const fetchApiActivities = async (
  when: 'upcoming' | 'past' = 'upcoming'
): Promise<ActivityDTO[]> => {
  const events = await api.getPublicActivities({ when, pageSize: 100 });
  return events.data;
};
