import {
  computeActivityDetailExposure,
  computeActivityMapPeekActions,
  resolveCommerceMapViewerAccess,
  resolvePublicPlaceMapViewerAccess,
  type ActivityJoinMode,
  type ActivityViewerAccessDTO,
  type ActivityViewerAccessLevel,
  type ExploreMapItemDTO,
  exploreMapItemIsSeeking,
} from '@uaetrail/shared-types';
import { MembershipRole, RequestStatus, UserRole } from '../domain/enums.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { listActivityEngagementForUserOnActivities } from './activity-engagement-store.js';
import { mapIntentJoinRequestStatusByIntentIdsForUser } from './participant-intent-requests-store.js';
import { listActiveTenantMembershipsByUser } from './tenant-access.js';
import { applyActivityViewEntitlements } from '../services/member-entitlements.js';

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

export type ExploreMapViewerAccessContext = {
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  participantActivityIds: Set<string>;
  requestStatusByActivityId: Map<string, RequestStatus>;
  staffTenantIds: Set<string>;
  demandJoinStatusByIntentId: Map<string, 'pending' | 'approved'>;
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
    };
  }

  const activityIds = input.items
    .filter((item) => item.source === 'activity' && item.activity?.id)
    .map((item) => item.activity!.id);

  const intentIds = input.items
    .filter((item) => exploreMapItemIsSeeking(item) && item.participantIntentId)
    .map((item) => item.participantIntentId as string);

  const [engagement, memberships, demandJoinStatusByIntentId] = await Promise.all([
    listActivityEngagementForUserOnActivities(viewerUserId, activityIds),
    listActiveTenantMembershipsByUser(viewerUserId),
    mapIntentJoinRequestStatusByIntentIdsForUser(viewerUserId, intentIds),
  ]);

  const staffTenantIds = new Set(
    memberships
      .filter((membership) => ORGANIZER_ROLES.includes(membership.role))
      .map((membership) => membership.tenantId)
  );

  return {
    viewerUserId,
    isPlatformAdmin,
    participantActivityIds: engagement.participantActivityIds,
    requestStatusByActivityId: engagement.requestStatusByActivityId,
    staffTenantIds,
    demandJoinStatusByIntentId,
  };
};

const withEntitlements = (
  ctx: ExploreMapViewerAccessContext,
  viewerAccess: ActivityViewerAccessDTO
): ActivityViewerAccessDTO =>
  applyActivityViewEntitlements(
    { viewerUserId: ctx.viewerUserId, hostStatus: null },
    viewerAccess
  );

export const attachExploreMapViewerAccess = (
  items: ExploreMapItemDTO[],
  ctx: ExploreMapViewerAccessContext
): ExploreMapItemDTO[] =>
  items.map((item) => {
    if (item.source === 'activity' && item.activity && !exploreMapItemIsSeeking(item)) {
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
      const activityPublished = item.activity.status === 'published';
      const rawRequestStatus = ctx.requestStatusByActivityId.get(item.activity.id);
      const joinRequestStatus =
        rawRequestStatus === RequestStatus.PENDING
          ? 'pending'
          : rawRequestStatus === RequestStatus.WAITLISTED
            ? 'waitlisted'
            : null;
      return {
        ...item,
        viewerAccess: withEntitlements(ctx, {
          ...exposure,
          mapPeekActions: computeActivityMapPeekActions({
            level,
            activityPublished,
            joinMode,
            joinRequestStatus,
          }),
        }),
      };
    }

    if (exploreMapItemIsSeeking(item)) {
      const intentId = item.participantIntentId ?? item.id.replace(/^demand:/, '');
      const requesterUserId =
        item.featuredPerson?.userId ?? item.requesterUserId ?? null;
      const joinRequestStatus = ctx.demandJoinStatusByIntentId.get(intentId) ?? null;
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

    if (item.source === 'venue') {
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
