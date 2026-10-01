import type { ActivityDTO, ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityHostUserId } from '@uaetrail/shared-types';

type ActivityLike = Pick<ActivityDTO, 'tenantId' | 'hostUserId' | 'hostId'> | ActivityDetailDTO;

/** True when the signed-in member hosts or manages this activity (not a joiner). */
export const viewerHostsActivity = (
  activity: ActivityLike | null | undefined,
  viewerUserId: string | null | undefined,
  viewerTenantId?: string | null,
  canPublishOnTenant?: boolean
): boolean => {
  if (!activity || !viewerUserId) return false;
  const hostUserId = resolveActivityHostUserId(activity);
  if (hostUserId && hostUserId === viewerUserId) return true;
  if (
    canPublishOnTenant &&
    viewerTenantId &&
    activity.tenantId &&
    activity.tenantId === viewerTenantId
  ) {
    return true;
  }
  return false;
};
