import type { ActivityType } from '../types';
import { resolveActivityTypeCoverImage } from '../config/activityCoverImages';

type ActivityHeroSource = {
  id?: string;
  activityType: ActivityType | string;
  images?: string[] | null;
  bannerUrl?: string | null;
  location?: { images?: string[] | null } | null;
};

/** Hero / OG / share preview image — uploaded art first, then kind placeholder. */
export const resolveActivityHeroImage = (activity: ActivityHeroSource): string => {
  const uploaded =
    activity.images?.find((url) => typeof url === 'string' && url.trim().length > 0)?.trim() ??
    activity.location?.images?.find((url) => typeof url === 'string' && url.trim().length > 0)?.trim() ??
    activity.bannerUrl?.trim();

  if (uploaded) return uploaded;

  const kind = activity.activityType as ActivityType;
  if (kind === 'hiking' || kind === 'camping' || kind === 'event' || kind === 'rideshare') {
    return resolveActivityTypeCoverImage(kind, null, { activityId: activity.id });
  }

  return resolveActivityTypeCoverImage('hiking', null, { activityId: activity.id });
};
