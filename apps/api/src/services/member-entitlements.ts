import type {
  ActivityViewerAccessDTO,
  HostStatusDTO,
  ProfileViewerAccessDTO,
} from '@uaetrail/shared-types';
import {
  computeActivityViewerEntitlements,
  mergeActivityMapPeekActionsWithEntitlements,
  viewerMaySeeProfileViewStats,
} from '@uaetrail/shared-types';
import { isConsumerProMember } from '../lib/consumer-pro-membership.js';

/** Inputs for layer-7 activity entitlements (buddy ∩ host, buddies on roster). */
export type ActivityViewEntitlementActivityContext = {
  hostUserId: string | null;
  isFriendOfHost: boolean;
  buddyUserIdsOnActivity: string[];
};

/** Passed to `composeActivityViewerAccess` — loaded inside the composer when viewer is signed in. */
export type ActivityViewEntitlementLoadInput = {
  hostUserId: string | null;
  participantUserIds: string[];
};

export type MemberEntitlementContext = {
  viewerUserId: string | null;
  hostStatus: HostStatusDTO | null;
};

/**
 * Layer 7 — apply paid / Pro / premium rules **after** social activity viewer access.
 *
 * @see docs/DOMAIN_CANONICALS.md §15.10
 */
export const applyActivityViewEntitlements = (
  ctx: MemberEntitlementContext,
  socialAccess: ActivityViewerAccessDTO,
  activityCtx?: ActivityViewEntitlementActivityContext
): ActivityViewerAccessDTO => {
  const isProMember = isConsumerProMember(ctx.hostStatus);
  const entitlements = computeActivityViewerEntitlements({
    isProMember,
    isFriendOfHost: activityCtx?.isFriendOfHost ?? false,
    level: socialAccess.level,
    canAccessCrewSurfaces: socialAccess.canAccessCrewSurfaces,
    buddyUserIdsOnActivity: activityCtx?.buddyUserIdsOnActivity ?? [],
  });

  const mapPeekActions =
    socialAccess.mapPeekActions && socialAccess.mapPeekActions.length > 0
      ? mergeActivityMapPeekActionsWithEntitlements(
          socialAccess.mapPeekActions,
          entitlements,
          socialAccess.level
        )
      : socialAccess.mapPeekActions;

  return {
    ...socialAccess,
    entitlements,
    mapPeekActions,
  };
};

/** Layer 7 — profile detail (passthrough until paid consumer rules ship). */
export const applyProfileViewEntitlements = (
  _ctx: MemberEntitlementContext,
  socialAccess: ProfileViewerAccessDTO
): ProfileViewerAccessDTO => socialAccess;

export const maySeeProfileViewStats = (ctx: MemberEntitlementContext): boolean =>
  viewerMaySeeProfileViewStats({
    viewerUserId: ctx.viewerUserId,
    hostStatus: ctx.hostStatus,
  });
