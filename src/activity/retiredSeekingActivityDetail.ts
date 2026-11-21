import type { ActivityDetailDTO } from '@uaetrail/shared-types';

/** Retired `activityMode: seeking` outings are off the map; detail is read-only archive. */
export const RETIRED_SEEKING_ACTIVITY_DETAIL_HEADER = 'Archived find post';

export const RETIRED_SEEKING_ACTIVITY_DETAIL_NOTICE =
  'This older “find crew” post is retired. Share your calendar on the map so people can go together.';

export const activityDetailIsRetiredSeekingPost = (
  activity: Pick<ActivityDetailDTO, 'activityMode'>
): boolean => activity.activityMode === 'seeking';