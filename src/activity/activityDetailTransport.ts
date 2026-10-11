import type { ActivityDetailDTO } from '@uaetrail/shared-types';

/** Consumer Transport tab — always shown (reach-by / vehicle access from organize; rideshare when linked). */
export const activityHasTransportDetailContent = (_activity: ActivityDetailDTO): boolean => true;
