import { MembershipRole, RequestStatus } from '../domain/enums.js';
import { resolveJoinMode, type ActivityJoinMode } from '../domain/activity-join-mode.js';
import {
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
} from '../lib/activity-engagement-store.js';
import { findGroupByActivityId, getGroupMembership } from '../lib/social-groups-store.js';
import { findTenantMembershipContext } from '../lib/tenant-access.js';

export type ActivityViewerAccessLevel =
  | 'platform_admin'
  | 'host'
  | 'tenant_staff'
  | 'participant'
  | 'join_request'
  | 'activity_group_member'
  | 'link_holder'
  | 'public'
  | 'denied';

export type ActivityViewerAccessResult = {
  level: ActivityViewerAccessLevel;
  canViewFullActivity: boolean;
  joinMode: ActivityJoinMode;
};

export const PRIVATE_ACTIVITY_MESSAGE =
  'This activity is private — only invited members can view it';

const ORGANIZER_ROLES: MembershipRole[] = [
  MembershipRole.TENANT_OWNER,
  MembershipRole.TENANT_ADMIN,
  MembershipRole.TENANT_GUIDE,
];

const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.APPROVED,
  RequestStatus.WAITLISTED,
];

export type ActivityViewerAccessInput = {
  viewerUserId: string | null;
  activity: {
    id: string;
    tenantId: string;
    hostId: string | null;
    createdById: string;
    joinMode?: unknown;
    requirements?: string[] | null;
  };
  isPlatformAdmin?: boolean;
};

/** Viewer-aware authorization for private activities (link access, not explore browse). */
export const resolveActivityViewerAccess = async (
  input: ActivityViewerAccessInput
): Promise<ActivityViewerAccessResult> => {
  const joinMode = resolveJoinMode(input.activity.joinMode, input.activity.requirements);

  if (joinMode === 'open') {
    return { level: 'public', canViewFullActivity: true, joinMode };
  }

  if (input.isPlatformAdmin) {
    return { level: 'platform_admin', canViewFullActivity: true, joinMode };
  }

  const viewerUserId = input.viewerUserId;
  if (!viewerUserId) {
    return { level: 'denied', canViewFullActivity: false, joinMode };
  }

  const hostUserId = input.activity.hostId ?? input.activity.createdById;
  if (viewerUserId === hostUserId || viewerUserId === input.activity.createdById) {
    return { level: 'host', canViewFullActivity: true, joinMode };
  }

  const membership = await findTenantMembershipContext(input.activity.tenantId, viewerUserId);
  if (membership && ORGANIZER_ROLES.includes(membership.role)) {
    return { level: 'tenant_staff', canViewFullActivity: true, joinMode };
  }

  const participant = await findActivityParticipantByEventAndUser(input.activity.id, viewerUserId);
  if (participant) {
    return { level: 'participant', canViewFullActivity: true, joinMode };
  }

  const request = await findActivityRequestByEventAndUser(input.activity.id, viewerUserId);
  if (request && ACTIVE_REQUEST_STATUSES.includes(request.status)) {
    return { level: 'join_request', canViewFullActivity: true, joinMode };
  }

  const activityGroup = await findGroupByActivityId(input.activity.id);
  if (activityGroup) {
    const groupMember = await getGroupMembership(activityGroup.id, viewerUserId);
    if (groupMember?.isActive) {
      return { level: 'activity_group_member', canViewFullActivity: true, joinMode };
    }
  }

  // Link-only private plans: signed-in members with the URL can view (not on public map).
  return { level: 'link_holder', canViewFullActivity: true, joinMode };
};
