import type { ActivityDetailDTO } from '@uaetrail/shared-types';

export const activityKidsJoinAllowed = (activity: ActivityDetailDTO): boolean => {
  if (activity.audience?.kidsWelcome === false) return false;
  if (activity.audience?.kidsWelcome === true) return true;
  const lines = activity.requirements ?? [];
  if (lines.some((line) => /^No children$/i.test(line.trim()))) return false;
  return true;
};
