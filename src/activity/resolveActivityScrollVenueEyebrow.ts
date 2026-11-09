import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import {
  activityDetailLinkedVenueEyebrow,
  activityDetailLinkedVenueKindLabel,
} from '../content/activityDetailCopy';

const resolveLinkedVenueKind = (
  activity: ActivityDetailDTO,
  placePath: string | null
): string | null | undefined => {
  const loc = activity.location?.activityType;
  if (loc === 'hiking' || loc === 'camping' || loc === 'event') return loc;
  const scheduled = activity.activityType;
  if (scheduled === 'hiking' || scheduled === 'camping' || scheduled === 'event') return scheduled;
  if (placePath?.includes('/trail/')) return 'hiking';
  if (placePath?.includes('/camp/')) return 'camping';
  if (placePath?.includes('/event/') || placePath?.includes('/venue/')) return 'event';
  return loc ?? scheduled;
};

/** Trail/camp/venue label for the catalog link row (not generic “Place” when path is `/trail/`). */
export const resolveActivityScrollVenueEyebrow = (
  activity: ActivityDetailDTO,
  placePath: string | null
): string => activityDetailLinkedVenueEyebrow(resolveLinkedVenueKind(activity, placePath));

export const resolveActivityScrollVenueKindLabel = (
  activity: ActivityDetailDTO,
  placePath: string | null
): string => activityDetailLinkedVenueKindLabel(resolveLinkedVenueKind(activity, placePath));
