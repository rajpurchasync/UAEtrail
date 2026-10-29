import {
  computeActivityDetailExposure,
  type ActivityViewerAccessDTO,
  type ActivityViewerAccessLevel,
} from '@uaetrail/shared-types';
import { MembershipRole, RequestStatus } from '../domain/enums.js';
import { resolveJoinMode, type ActivityJoinMode } from '../domain/activity-join-mode.js';
import {
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
} from '../lib/activity-engagement-store.js';
import { findGroupByActivityId, getGroupMembership } from '../lib/social-groups-store.js';
import { findTenantMembershipContext } from '../lib/tenant-access.js';
import { findPendingActivityInviteForInvitee } from '../lib/activity-invites-store.js';

export type { ActivityViewerAccessLevel, ActivityViewerAccessDTO };

export type ActivityViewerAccessResult = ActivityViewerAccessDTO;

export const PRIVATE_ACTIVITY_MESSAGE =
  'This activity is private — only invited members can view it';

const HOST_MEMBERSHIP_ROLES: MembershipRole[] = [
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
    guides?: Array<{ userId: string; status?: string }>;
  };
  isPlatformAdmin?: boolean;
};

const resolveActivityViewerLevel = async (
  input: ActivityViewerAccessInput,
  joinMode: ActivityJoinMode
): Promise<ActivityViewerAccessLevel> => {
  if (input.isPlatformAdmin) {
    return 'platform_admin';
  }

  const viewerUserId = input.viewerUserId;
  if (!viewerUserId) {
    return joinMode === 'open' ? 'public' : 'denied';
  }

  const hostUserId = input.activity.hostId ?? input.activity.createdById;
  if (viewerUserId === hostUserId || viewerUserId === input.activity.createdById) {
    return 'host';
  }
  const acceptedGuide = (input.activity.guides ?? []).some(
    (guide) => guide.userId === viewerUserId && (guide.status ?? 'accepted') === 'accepted'
  );
  if (acceptedGuide) {
    return 'host';
  }

  const membership = await findTenantMembershipContext(input.activity.tenantId, viewerUserId);
  if (membership && HOST_MEMBERSHIP_ROLES.includes(membership.role)) {
    return 'tenant_staff';
  }

  const participant = await findActivityParticipantByEventAndUser(input.activity.id, viewerUserId);
  if (participant) {
    return 'participant';
  }

  const request = await findActivityRequestByEventAndUser(input.activity.id, viewerUserId);
  if (request && ACTIVE_REQUEST_STATUSES.includes(request.status)) {
    return 'join_request';
  }

  const activityGroup = await findGroupByActivityId(input.activity.id);
  if (activityGroup) {
    const groupMember = await getGroupMembership(activityGroup.id, viewerUserId);
    if (groupMember?.isActive) {
      return 'activity_group_member';
    }
  }

  const pendingInvite = await findPendingActivityInviteForInvitee({
    activityId: input.activity.id,
    toUserId: viewerUserId,
  });
  if (pendingInvite) {
    return 'join_request';
  }

  const pendingGuide = (input.activity.guides ?? []).some(
    (guide) => guide.userId === viewerUserId && guide.status === 'pending'
  );
  if (pendingGuide) {
    return 'join_request';
  }

  if (joinMode === 'private') {
    return 'denied';
  }

  return 'link_holder';
};

/** Viewer-aware authorization for activity detail and explore peek hints. */
export const buildActivityViewerAccess = async (
  input: ActivityViewerAccessInput
): Promise<ActivityViewerAccessResult> => {
  const joinMode = resolveJoinMode(input.activity.joinMode, input.activity.requirements);
  const level = await resolveActivityViewerLevel(input, joinMode);
  return computeActivityDetailExposure({
    joinMode,
    level,
    viewerUserId: input.viewerUserId,
  });
};

