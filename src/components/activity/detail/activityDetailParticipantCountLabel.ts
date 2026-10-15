import type { ActivityDetailDTO } from '@uaetrail/shared-types';

/** Joined headcount vs capacity for marketing fold participant header. */
export const activityDetailParticipantCountLabel = (activity: ActivityDetailDTO): string | null => {
  const total = activity.slotsTotal ?? 0;
  if (total <= 0) return null;
  const joined = Math.max(
    activity.participants?.length ?? 0,
    total - (activity.slotsAvailable ?? 0)
  );
  return `${joined}/${total}`;
};
