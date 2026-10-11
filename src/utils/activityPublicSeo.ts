import type { ActivityDetailDTO } from '@uaetrail/shared-types';

/** Public OG/meta copy — no meeting point, coordinates, or full host notes. */
export const activityPublicMetaDescription = (
  activity: Pick<ActivityDetailDTO, 'activityType' | 'title' | 'locationName' | 'region'>
): string => {
  const label = activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan';
  const where = activity.region?.trim();
  return where
    ? `Join ${label} in ${where} on UAE Trail — find your crew and get outside together.`
    : `Join this ${activity.activityType} outing on UAE Trail — find your crew and get outside together.`;
};

export const activityPublicShareText = (
  activity: Pick<ActivityDetailDTO, 'id' | 'activityType' | 'title' | 'locationName' | 'date'>
): string => {
  const label = activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan';
  const when = activity.date?.trim();
  return when ? `${when} · ${label} on UAE Trail` : `${label} — join on UAE Trail`;
};
