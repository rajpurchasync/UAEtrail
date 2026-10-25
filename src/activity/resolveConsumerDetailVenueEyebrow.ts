import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityDetailLinkedVenueEyebrow } from '../content/activityDetailCopy';

/** Trail/camp/venue label for the catalog link row (not generic “Place” when path is `/trail/`). */
export const resolveConsumerDetailVenueEyebrow = (
  activity: ActivityDetailDTO,
  placePath: string | null
): string => {
  const loc = activity.location?.activityType;
  if (loc === 'hiking' || loc === 'camping' || loc === 'event') {
    return activityDetailLinkedVenueEyebrow(loc);
  }
  const scheduled = activity.activityType;
  if (scheduled === 'hiking' || scheduled === 'camping' || scheduled === 'event') {
    return activityDetailLinkedVenueEyebrow(scheduled);
  }
  if (placePath?.includes('/trail/')) return activityDetailLinkedVenueEyebrow('hiking');
  if (placePath?.includes('/camp/')) return activityDetailLinkedVenueEyebrow('camping');
  if (placePath?.includes('/event/') || placePath?.includes('/venue/')) {
    return activityDetailLinkedVenueEyebrow('event');
  }
  return activityDetailLinkedVenueEyebrow(loc ?? scheduled);
};
