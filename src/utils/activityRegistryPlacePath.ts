import type { ActivityType, LocationDTO } from '@uaetrail/shared-types';
import { placeDetailPathForId } from '@uaetrail/shared-types';

type ActivityPlaceLink = {
  locationId: string;
  activityType: ActivityType;
  location?: LocationDTO | null;
};

/**
 * Public place detail URL when the activity is tied to a registry venue.
 * Uses the **place** activityType only — never the outing type (an event at a camp
 * must not become `/venue/{campId}`).
 */
export const activityRegistryPlacePath = (activity: ActivityPlaceLink): string | null => {
  const id = activity.locationId?.trim();
  if (!id) return null;

  const placeType = activity.location?.activityType?.trim() || null;
  if (placeType === 'rideshare') return null;

  return placeDetailPathForId(id, placeType);
};
