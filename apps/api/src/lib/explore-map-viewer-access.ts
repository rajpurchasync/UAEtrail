import {
  computeActivityDetailExposure,
  resolveActivityEngagementMapPeekActionsBase,
  resolveActivityEngagementMapPeekStrips,
  resolveCommerceMapViewerAccess,
  resolvePublicPlaceMapViewerAccess,
  type ActivityJoinMode,
  type ActivityViewerAccessDTO,
  type ActivityViewerAccessLevel,
  type ExploreMapItemDTO,
  exploreMapItemIsSeeking,
  isGeographyMapSource,
} from '@uaetrail/shared-types';
import { MembershipRole, RequestStatus, UserRole } from '../domain/enums.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { listActivityEngagementForUserOnActivities } from './activity-engagement-store.js';
import { mapIntentJoinRequestStatusByIntentIdsForUser } from './participant-intent-requests-store.js';
import { listActiveTenantMembershipsByUser } from './tenant-access.js';
import { listBuddiesForUser } from './buddy-store.js';
import { countPendingActivityInvitesByActivityIdsForSender } from './activity-invites-store.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import { filterSubjectsVisibleInFindCrew } from './find-crew-visibility-gate.js';
import { resolveMemberStatusForExploreOverlay } from '../services/member-status-overlay-cache.js';
import { applyActivityViewEntitlements } from '../services/member-entitlements.js';
import type { HostStatusDTO } from '@uaetrail/shared-types';
import { buildMapPeekEngagementPolicyInput } from './activity-engagement-policy-input.js';

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

export type ExploreMapViewerAccessContext = {
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  participantActivityIds: Set<string>;
  requestStatusByActivityId: Map<string, RequestStatus>;
  staffTenantIds: Set<string>;
  demandJoinStatusByIntentId: Map<string, 'pending' | 'approved'>;
  hostStatus: HostStatusDTO | null;
  buddyUserIds: Set<string>;
  pendingJoinInviteCountByActivityId: Map<string, number>;
};

export const resolveDemandMapViewerAccess = (input: {
  viewerUserId: string | null;
  requesterUserId: string | null;
  joinRequestStatus: 'pending' | 'approved' | null;
}): ActivityViewerAccessDTO => {
  const joinMode: ActivityJoinMode = 'open';
  if (!input.viewerUserId) {
    return computeActivityDetailExposure({
      joinMode,
      level: 'public',
      viewerUserId: null,
    });
  }
  if (input.requesterUserId && input.requesterUserId === input.viewerUserId) {
    return computeActivityDetailExposure({
      joinMode,
      level: 'host',
      viewerUserId: input.viewerUserId,
    });
  }
  if (input.joinRequestStatus === 'approved') {
    return computeActivityDetailExposure({
      joinMode,
      level: 'participant',
      viewerUserId: input.viewerUserId,
    });
  }
  if (input.joinRequestStatus === 'pending') {
    return computeActivityDetailExposure({
      joinMode,
      level: 'join_request',
      viewerUserId: input.viewerUserId,
    });
  }
  return computeActivityDetailExposure({
    joinMode,
    level: 'link_holder',
    viewerUserId: input.viewerUserId,
  });
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

  const hostUserId =
    input.activity.hostId ?? input.activity.hostUserId ?? input.activity.createdById ?? null;
  if (hostUserId && (viewerUserId === hostUserId || viewerUserId === input.activity.createdById)) {
    return 'host';
  }

  if (input.staffTenantIds.has(input.activity.tenantId)) {
    return 'tenant_staff';
  }

  if (input.participantActivityIds.has(input.activity.id)) {
    return 'participant';
  }

  const requestStatus = input.requestStatusByActivityId.get(input.activity.id);
  if (requestStatus && ACTIVE_REQUEST_STATUSES.includes(requestStatus)) {
    return 'join_request';
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
      demandJoinStatusByIntentId: new Map(),
      hostStatus: null,
      buddyUserIds: new Set(),
      pendingJoinInviteCountByActivityId: new Map(),
    };
  }

  const activityIds = input.items
    .filter((item) => item.source === 'activity' && item.activity?.id)
    .map((item) => item.activity!.id);

  const intentIds = input.items
    .filter((item) => exploreMapItemIsSeeking(item) && item.participantIntentId)
    .map((item) => item.participantIntentId as string);

  const [engagement, memberships, demandJoinStatusByIntentId, hostStatus, buddies, pendingJoinInviteCountByActivityId] =
    await Promise.all([
      listActivityEngagementForUserOnActivities(viewerUserId, activityIds),
      listActiveTenantMembershipsByUser(viewerUserId),
      mapIntentJoinRequestStatusByIntentIdsForUser(viewerUserId, intentIds),
      resolveMemberStatusForExploreOverlay(viewerUserId),
      listBuddiesForUser(viewerUserId),
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
    demandJoinStatusByIntentId,
    hostStatus,
    buddyUserIds: new Set(buddies.map((buddy) => buddy.userId)),
    pendingJoinInviteCountByActivityId,
  };
};

const withEntitlements = (
  ctx: ExploreMapViewerAccessContext,
  viewerAccess: ActivityViewerAccessDTO,
  activityCtx?: {
    hostUserId: string | null;
    buddyUserIdsOnActivity: string[];
  }
): ActivityViewerAccessDTO =>
  applyActivityViewEntitlements(
    { viewerUserId: ctx.viewerUserId, hostStatus: ctx.hostStatus },
    viewerAccess,
    activityCtx
      ? {
          hostUserId: activityCtx.hostUserId,
          isFriendOfHost: Boolean(
            activityCtx.hostUserId && ctx.buddyUserIds.has(activityCtx.hostUserId)
          ),
          buddyUserIdsOnActivity: activityCtx.buddyUserIdsOnActivity,
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
      const joinRequestStatus: 'pending' | 'waitlisted' | null =
        rawRequestStatus === RequestStatus.PENDING
          ? 'pending'
          : rawRequestStatus === RequestStatus.WAITLISTED
            ? 'waitlisted'
            : null;
      const hostUserId = item.activity.hostUserId ?? item.featuredPerson?.userId ?? null;
      const participantUserIds = (item.participantPreviews ?? []).map((preview) => preview.id);
      const buddyOnActivity = participantUserIds.filter((id) => ctx.buddyUserIds.has(id));
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
        { hostUserId, buddyUserIdsOnActivity: buddyOnActivity }
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

    if (exploreMapItemIsSeeking(item)) {
      const intentId = item.participantIntentId;
      const requesterUserId =
        item.featuredPerson?.userId ?? item.requesterUserId ?? null;
      const joinRequestStatus = intentId
        ? ctx.demandJoinStatusByIntentId.get(intentId) ?? null
        : null;
      return {
        ...item,
        viewerAccess: withEntitlements(
          ctx,
          resolveDemandMapViewerAccess({
            viewerUserId: ctx.viewerUserId,
            requesterUserId,
            joinRequestStatus,
          })
        ),
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
  const withAccess = attachExploreMapViewerAccess(payload.items, ctx);

  const seekerIds = new Set<string>();
  for (const item of withAccess) {
    if (!exploreMapItemIsSeeking(item)) continue;
    const seekerId = item.featuredPerson?.userId ?? item.requesterUserId ?? null;
    if (seekerId) seekerIds.add(seekerId);
  }
  if (seekerIds.size === 0) {
    return { items: withAccess };
  }

  const seekers = await findAuthUsersByIds([...seekerIds]);
  const visibleSeekers = await filterSubjectsVisibleInFindCrew(seekers, input.viewerUserId);
  const items = withAccess.filter((item) => {
    if (!exploreMapItemIsSeeking(item)) return true;
    const seekerId = item.featuredPerson?.userId ?? item.requesterUserId ?? null;
    if (!seekerId) return true;
    // Own seeking pins always remain visible.
    if (input.viewerUserId && seekerId === input.viewerUserId) return true;
    return visibleSeekers.has(seekerId);
  });
  return { items };
};
