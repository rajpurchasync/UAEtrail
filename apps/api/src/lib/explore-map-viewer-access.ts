import {
  activityJoinEngagementSnapshotFromViewerFacts,
  activityViewerLevelFromJoinEngagement,
  computeActivityDetailExposure,
  mapPeekJoinRequestStatusFromWire,
  resolveActivityHostUserId,
  resolveActivityEngagementMapPeekActionsBase,
  resolveActivityEngagementMapPeekStrips,
  resolveCommerceMapViewerAccess,
  resolvePublicPlaceMapViewerAccess,
  type ActivityViewerAccessDTO,
  type ActivityViewerAccessLevel,
  type ExploreMapItemDTO,
  isGeographyMapSource,
} from '@uaetrail/shared-types';
import { MembershipRole, RequestStatus, UserRole } from '../domain/enums.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { listActivityEngagementForUserOnActivities } from './activity-engagement-store.js';
import { listActiveTenantMembershipsByUser } from './tenant-access.js';
import { listFriendsForUser } from './friend-store.js';
import { countPendingActivityInvitesByActivityIdsForSender } from './activity-invites-store.js';
import { resolveMemberStatusForExploreOverlay } from '../services/member-status-overlay-cache.js';
import { applyActivityViewEntitlements } from '../services/member-entitlements.js';
import type { HostStatusDTO } from '@uaetrail/shared-types';
import { buildMapPeekEngagementPolicyInput } from './activity-engagement-policy-input.js';

const HOST_MEMBERSHIP_ROLES: MembershipRole[] = [
  MembershipRole.TENANT_OWNER,
  MembershipRole.TENANT_ADMIN,
  MembershipRole.TENANT_GUIDE,
];

export type ExploreMapViewerAccessContext = {
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  participantActivityIds: Set<string>;
  requestStatusByActivityId: Map<string, RequestStatus>;
  staffTenantIds: Set<string>;
  hostStatus: HostStatusDTO | null;
  friendUserIds: Set<string>;
  pendingJoinInviteCountByActivityId: Map<string, number>;
};

export const resolveActivityMapViewerLevel = (input: {
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  activity: {
    id: string;
    tenantId: string;
    hostId?: string | null;
    hostUserId?: string | null;
    createdById?: string | null;
  };
  participantActivityIds: Set<string>;
  requestStatusByActivityId: Map<string, RequestStatus>;
  staffTenantIds: Set<string>;
}): ActivityViewerAccessLevel => {
  if (input.isPlatformAdmin) {
    return 'platform_admin';
  }
  const viewerUserId = input.viewerUserId;
  if (!viewerUserId) {
    return 'public';
  }

  const hostUserId = resolveActivityHostUserId(input.activity);
  if (hostUserId && viewerUserId === hostUserId) {
    return 'host';
  }

  if (input.staffTenantIds.has(input.activity.tenantId)) {
    return 'tenant_staff';
  }

  const fromJoin = activityViewerLevelFromJoinEngagement(
    activityJoinEngagementSnapshotFromViewerFacts({
      hasParticipation: input.participantActivityIds.has(input.activity.id),
      requestStatus: input.requestStatusByActivityId.get(input.activity.id) ?? null,
    })
  );
  if (fromJoin) {
    return fromJoin;
  }

  return 'link_holder';
};

export const buildExploreMapViewerAccessContext = async (input: {
  viewerUserId: string | null;
  userRole?: string | null;
  items: ExploreMapItemDTO[];
}): Promise<ExploreMapViewerAccessContext> => {
  const viewerUserId = input.viewerUserId;
  const isPlatformAdmin = input.userRole === UserRole.PLATFORM_ADMIN;

  if (!viewerUserId) {
    return {
      viewerUserId: null,
      isPlatformAdmin: false,
      participantActivityIds: new Set(),
      requestStatusByActivityId: new Map(),
      staffTenantIds: new Set(),
      hostStatus: null,
      friendUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    };
  }

  const activityIds = input.items
    .filter((item) => item.source === 'activity' && item.activity?.id)
    .map((item) => item.activity!.id);

  const [engagement, memberships, hostStatus, friends, pendingJoinInviteCountByActivityId] =
    await Promise.all([
      listActivityEngagementForUserOnActivities(viewerUserId, activityIds),
      listActiveTenantMembershipsByUser(viewerUserId),
      resolveMemberStatusForExploreOverlay(viewerUserId),
      listFriendsForUser(viewerUserId),
      countPendingActivityInvitesByActivityIdsForSender({
        fromUserId: viewerUserId,
        activityIds,
      }),
    ]);

  const staffTenantIds = new Set(
    memberships
      .filter((membership) => HOST_MEMBERSHIP_ROLES.includes(membership.role))
      .map((membership) => membership.tenantId)
  );

  return {
    viewerUserId,
    isPlatformAdmin,
    participantActivityIds: engagement.participantActivityIds,
    requestStatusByActivityId: engagement.requestStatusByActivityId,
    staffTenantIds,
    hostStatus,
    friendUserIds: new Set(friends.map((friend) => friend.userId)),
    pendingJoinInviteCountByActivityId,
  };
};

const withEntitlements = (
  ctx: ExploreMapViewerAccessContext,
  viewerAccess: ActivityViewerAccessDTO,
  activityCtx?: {
    hostUserId: string | null;
    friendUserIdsOnActivity: string[];
  }
): ActivityViewerAccessDTO =>
  applyActivityViewEntitlements(
    { viewerUserId: ctx.viewerUserId, hostStatus: ctx.hostStatus },
    viewerAccess,
    activityCtx
      ? {
          hostUserId: activityCtx.hostUserId,
          isFriendOfHost: Boolean(
            activityCtx.hostUserId && ctx.friendUserIds.has(activityCtx.hostUserId)
          ),
          friendUserIdsOnActivity: activityCtx.friendUserIdsOnActivity,
        }
      : undefined
  );

export const attachExploreMapViewerAccess = (
  items: ExploreMapItemDTO[],
  ctx: ExploreMapViewerAccessContext
): ExploreMapItemDTO[] =>
  items.map((item) => {
    if (item.source === 'activity' && item.activity) {
      const joinMode = resolveJoinMode(item.activity.joinMode, item.activity.requirements);
      const level = resolveActivityMapViewerLevel({
        viewerUserId: ctx.viewerUserId,
        isPlatformAdmin: ctx.isPlatformAdmin,
        activity: {
          id: item.activity.id,
          tenantId: item.activity.tenantId,
          hostId: item.activity.hostId,
          hostUserId: item.activity.hostUserId,
          createdById: item.activity.createdById,
        },
        participantActivityIds: ctx.participantActivityIds,
        requestStatusByActivityId: ctx.requestStatusByActivityId,
        staffTenantIds: ctx.staffTenantIds,
      });
      const exposure = computeActivityDetailExposure({
        joinMode,
        level,
        viewerUserId: ctx.viewerUserId,
      });
      const rawRequestStatus = ctx.requestStatusByActivityId.get(item.activity.id);
      const joinRequestStatus = mapPeekJoinRequestStatusFromWire(rawRequestStatus);
      const hostUserId = item.activity.hostUserId ?? item.featuredPerson?.userId ?? null;
      const participantUserIds = (item.participantPreviews ?? []).map((preview) => preview.id);
      const friendsOnActivity = participantUserIds.filter((id) => ctx.friendUserIds.has(id));
      const isHostUser = level === 'host';
      const onRoster = ctx.participantActivityIds.has(item.activity.id);
      const engagementPolicyInput = buildMapPeekEngagementPolicyInput({
        viewerAccess: { ...exposure, level, mapPeekActions: [] },
        activity: item.activity,
        isHostUser,
        joinMode,
        joinRequestStatus,
        onRoster,
        confirmedParticipantCount: item.participantPreviews?.length ?? 0,
        pendingJoinInviteCount:
          ctx.pendingJoinInviteCountByActivityId.get(item.activity.id) ?? 0,
      });
      const viewerAccessWithEntitlements = withEntitlements(
        ctx,
        {
          ...exposure,
          mapPeekActions: resolveActivityEngagementMapPeekActionsBase(engagementPolicyInput),
        },
        { hostUserId, friendUserIdsOnActivity: friendsOnActivity }
      );

      return {
        ...item,
        viewerAccess: {
          ...viewerAccessWithEntitlements,
          mapPeekStrips: resolveActivityEngagementMapPeekStrips({
            ...engagementPolicyInput,
            viewerAccess: viewerAccessWithEntitlements,
          }),
        },
      };
    }

    if (item.source === 'shop' || item.kind === 'shop' || item.source === 'agency') {
      return {
        ...item,
        viewerAccess: withEntitlements(ctx, resolveCommerceMapViewerAccess(ctx.viewerUserId)),
      };
    }

    if (isGeographyMapSource(item.source)) {
      return {
        ...item,
        viewerAccess: withEntitlements(ctx, resolvePublicPlaceMapViewerAccess()),
      };
    }

    return item;
  });

export const enrichExploreMapPayloadViewerAccess = async (
  payload: { items: ExploreMapItemDTO[] },
  input: { viewerUserId: string | null; userRole?: string | null }
): Promise<{ items: ExploreMapItemDTO[] }> => {
  const ctx = await buildExploreMapViewerAccessContext({
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
    items: payload.items,
  });
  return { items: attachExploreMapViewerAccess(payload.items, ctx) };
};
