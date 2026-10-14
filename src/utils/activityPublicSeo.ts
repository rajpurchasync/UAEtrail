import { activityPublicMetaDescription as activityPublicMetaDescriptionCanonical } from '@uaetrail/shared-types';

/** @deprecated Import from `@uaetrail/shared-types` — re-export for existing FE imports. */
export const activityPublicMetaDescription = activityPublicMetaDescriptionCanonical;

export const activityPublicShareText = (
  activity: Pick<
    import('@uaetrail/shared-types').ActivityDetailDTO,
    'id' | 'activityType' | 'title' | 'locationName' | 'date'
  >
): string => {
  const label = activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan';
  const when = activity.date?.trim();
  return when ? `${when} · ${label} on UAE Trail` : `${label} — join on UAE Trail`;
};
