export {
  normalizePlaceActivityType,
  placeDetailPath,
  type PlaceVenueKind,
} from '@uaetrail/shared-types';

import { placeDetailPath } from '@uaetrail/shared-types';

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
