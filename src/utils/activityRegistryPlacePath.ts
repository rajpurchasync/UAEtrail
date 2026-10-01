import type { ActivityType, LocationDTO } from '@uaetrail/shared-types';
import { placeDetailPath } from '@uaetrail/shared-types';

type ActivityPlaceLink = {
  locationId: string;
  activityType: ActivityType;
  location?: LocationDTO | null;
};

/** Public place detail URL when the activity is tied to a registry venue. */
export const activityRegistryPlacePath = (activity: ActivityPlaceLink): string | null => {
  const id = activity.locationId?.trim();
  if (!id) return null;

  const placeType =
    activity.location?.activityType ??
    (activity.activityType === 'rideshare' ? 'hiking' : activity.activityType);

  if (placeType === 'rideshare') return null;

  return placeDetailPath(placeType, id);
};
