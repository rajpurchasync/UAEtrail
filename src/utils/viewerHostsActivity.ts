import type { ActivityDTO, ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityHostUserId } from '@uaetrail/shared-types';
import { isPlatformAdmin } from './roles';

type ActivityLike = Pick<ActivityDTO, 'tenantId' | 'hostUserId' | 'hostId'> | ActivityDetailDTO;

/** True when the signed-in member is this activity’s host user (Chat · Manage CTAs, not tenant-wide staff). */
export const viewerIsActivityHostUser = (
  activity: ActivityLike | null | undefined,
  viewerUserId: string | null | undefined
): boolean => {
  if (!activity || !viewerUserId) return false;
  const hostUserId = resolveActivityHostUserId(activity);
  return Boolean(hostUserId && hostUserId === viewerUserId);
};

/** Host roster, check-in, edit — activity host or platform admin only. */
export const viewerCanManageActivityOuting = (
  activity: ActivityLike | null | undefined,
  viewerUserId: string | null | undefined,
  viewerRole?: string | null
): boolean => {
  if (viewerIsActivityHostUser(activity, viewerUserId)) return true;
  return isPlatformAdmin(viewerRole);
};

