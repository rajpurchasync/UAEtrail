import type { ActivityDetailDTO, ActivityDTO, LocationDTO, ActivityType as SharedActivityType } from '@uaetrail/shared-types';

const fallbackLocation = (
  locationId: string,
  name: string,
  activityType: SharedActivityType,
  region = ''
): LocationDTO => ({
  id: locationId,
  name,
  region,
  activityType,
  description: '',
  season: [],
  childFriendly: false,
  images: [],
  featured: false,
  status: 'active',
  countryCode: 'AE',
});

/** Build an ActivityDetailDTO for list/dashboard preview from a saved activity row. */
export const buildActivityDetailFromListItem = (
  activity: ActivityDTO,
  venue?: LocationDTO
): ActivityDetailDTO => {
  const activityType = activity.activityType ?? 'hiking';
  const venueName = venue?.name ?? activity.locationName ?? 'Venue';

  return {
    ...activity,
    participants: activity.participantPreviews ?? [],
    location:
      venue ??
      fallbackLocation(activity.locationId, venueName, activityType, activity.region ?? ''),
    myParticipation: null,
    myRequest: null,
  };
};
