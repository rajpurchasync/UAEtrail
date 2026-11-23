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
