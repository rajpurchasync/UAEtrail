import type { ActivityType } from '@uaetrail/shared-types';

/** Normalise trail / camp / event activity type strings. */
export const normalizePlaceActivityType = (activityType: string): ActivityType | 'community_activity' => {
  const kind = activityType.toLowerCase();
  if (kind === 'camping') return 'camping';
  if (kind === 'event' || kind === 'community_activity') return 'event';
  if (kind === 'carpool') return 'carpool';
  return 'hiking';
};

/** Public URL for a place (trail, camp, or event venue). */
export const placeDetailPath = (activityType: string, placeId: string): string => {
  const kind = normalizePlaceActivityType(activityType);
  if (kind === 'camping') return `/camp/${placeId}`;
  if (kind === 'event') return `/event/${placeId}`;
  return `/trail/${placeId}`;
};

export const placeReviewPath = (activityType: string, placeId: string): string =>
  `${placeDetailPath(activityType, placeId)}#reviews`;

export const placeSharePath = (activityType: string, placeId: string): string =>
  placeDetailPath(activityType, placeId);

/** @deprecated Use placeDetailPath */
export const locationDetailPath = (activityType: string, locationId: string): string =>
  placeDetailPath(activityType, locationId);

/** @deprecated Use placeReviewPath */
export const locationReviewPath = (activityType: string, locationId: string): string =>
  placeReviewPath(activityType, locationId);

/** @deprecated Use placeSharePath */
export const locationSharePath = (activityType: string, locationId: string): string =>
  placeSharePath(activityType, locationId);

/** @deprecated Use placeDetailPath — “venue” is a typed place in product language. */
export const venueLocationPath = (activityType: 'hiking' | 'camping' | 'event', id: string): string =>
  placeDetailPath(activityType, id);
