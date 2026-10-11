import type { ActivityDetailDTO } from '@uaetrail/shared-types';

/** Consumer Transport tab — rideshare on this outing or linked parent transport listing. */
export const activityHasTransportDetailContent = (activity: ActivityDetailDTO): boolean =>
  Boolean(activity.rideshareEnabled || activity.linkedParentActivity);
