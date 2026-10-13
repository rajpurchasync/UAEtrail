import type { ActivityJoinMode } from './activity-join-mode.js';
import {
  buildActivityPresentationDTO,
  type ActivityPresentationDTO,
  type BuildActivityPresentationInput,
} from './activity-detail-presentation.js';
import {
  computeActivityMapPeekActions,
  type ActivityMapPeekAction,
  type ActivityMapPeekActionId,
  type MapPeekJoinRequestStatus,
} from './activity-map-peek-actions.js';
import type { ActivityJoinEngagementKind } from './activity-join-engagement.js';
import type { ActivityViewerAccessLevel } from './activity-viewer-access.js';
import {
  mergeActivityMapPeekActionsWithEntitlements,
  type ActivityViewerEntitlementsDTO,
} from './activity-viewer-entitlements.js';

/** Surface-agnostic engagement intents (today 1:1 with map peek wire ids; footer kinds project separately). */
export type ActivityEngagementIntentId = ActivityMapPeekActionId;

export type ActivityEngagementIntent = ActivityMapPeekAction;

export type ActivityEngagementCapabilities = {
  isHostUser: boolean;
  joinEngagement: ActivityJoinEngagementKind;
  canAccessCrewSurfaces: boolean;
  canViewHostProfileBeforeJoin: boolean;
  canViewFullBuddyRoster: boolean;
  canOfferTransport: boolean;
  canAddLinkedRide: boolean;
  canMessageHostBeforeJoin: boolean;
};

/** Map peek strip affordances (Participants + Logistics zones). */
export type ActivityEngagementStripsDTO = {
  showParticipantsStrip: boolean;
  showLogisticsStrip: boolean;
  showJoinedStatusChipOnPeek: boolean;
  showHostSelfProfileLink: boolean;
  showOfferRideInLogistics: boolean;
  maskRosterToFriendsOnly: boolean;
  /** Pending Join me invites the signed-in viewer sent for this activity (explore map wire). */
  pendingJoinInviteCount: number;
};

export type ActivityEngagementPolicyDTO = {
  capabilities: ActivityEngagementCapabilities;
  /** Ordered intents before surface projection / entitlement merge. */
  intents: ActivityEngagementIntent[];
  strips: ActivityEngagementStripsDTO;
  presentation: ActivityPresentationDTO;
};

export type ResolveActivityEngagementPolicyInput = BuildActivityPresentationInput & {
  joinMode?: ActivityJoinMode;
  joinRequestStatus?: MapPeekJoinRequestStatus | null;
};

const resolveJoinRequestStatus = (
  input: ResolveActivityEngagementPolicyInput
): MapPeekJoinRequestStatus | null => {
  if (input.joinRequestStatus !== undefined) {
    return input.joinRequestStatus;
  }
  if (!input.myRequest?.canWithdraw) return null;
  if (input.myRequest.status === 'pending' || input.myRequest.status === 'waitlisted') {
    return input.myRequest.status;
  }
  return null;
};

const enrichEngagementIntents = (
  intents: ActivityMapPeekAction[],
  capabilities: ActivityEngagementCapabilities,
  activityPublished: boolean
): ActivityMapPeekAction[] => {
  if (capabilities.isHostUser || capabilities.joinEngagement !== 'confirmed') {
    return intents;
  }
  const core = intents.filter((action) => action.id !== 'view_detail');
  const extras: ActivityMapPeekAction[] = [{ id: 'withdraw_join', prominence: 'link' }];
  if (capabilities.canOfferTransport && activityPublished) {
    extras.push({ id: 'offer_rideshare', prominence: 'link' });
  }
  const viewDetail = intents.find((action) => action.id === 'view_detail');
  return [...core, ...extras, ...(viewDetail ? [viewDetail] : [])];
};

const resolveStrips = (
  input: ResolveActivityEngagementPolicyInput,
  capabilities: ActivityEngagementCapabilities
): ActivityEngagementStripsDTO => {
  const pendingJoinInviteCount = Math.max(0, input.pendingJoinInviteCount ?? 0);
  const canShowPendingInvites =
    capabilities.isHostUser || capabilities.joinEngagement === 'confirmed';

  return {
    showParticipantsStrip: true,
    showLogisticsStrip: true,
    showJoinedStatusChipOnPeek:
      capabilities.joinEngagement === 'confirmed' && !capabilities.isHostUser,
    showHostSelfProfileLink: capabilities.isHostUser,
    showOfferRideInLogistics:
      capabilities.canOfferTransport || capabilities.canAddLinkedRide,
    maskRosterToFriendsOnly:
      !capabilities.isHostUser && !capabilities.canViewFullBuddyRoster,
    pendingJoinInviteCount: canShowPendingInvites ? pendingJoinInviteCount : 0,
  };
};

/**
 * L1 engagement policy — capabilities, intents, peek strips, and detail presentation from one input.
 * Map peek buttons: `projectActivityMapPeekActions(policy, entitlements, level)`.
 */
export const resolveActivityEngagementPolicy = (
  input: ResolveActivityEngagementPolicyInput
): ActivityEngagementPolicyDTO => {
  const presentation = buildActivityPresentationDTO(input);
  const level: ActivityViewerAccessLevel = input.viewerAccess?.level ?? 'public';
  const entitlements = input.viewerAccess?.entitlements ?? null;
  const joinRequestStatus = resolveJoinRequestStatus(input);

  const capabilities: ActivityEngagementCapabilities = {
    isHostUser: input.isHostUser,
    joinEngagement: presentation.engagement.joinEngagement,
    canAccessCrewSurfaces: presentation.engagement.canAccessCrewSurfaces,
    canViewHostProfileBeforeJoin: entitlements?.canViewHostProfileBeforeJoin ?? false,
    canViewFullBuddyRoster: entitlements?.canViewFullBuddyRoster ?? false,
    canOfferTransport: entitlements?.canOfferTransport ?? false,
    canAddLinkedRide: entitlements?.canAddLinkedRide ?? false,
    canMessageHostBeforeJoin: entitlements?.canMessageHostBeforeJoin ?? false,
  };

  const intents = enrichEngagementIntents(
    computeActivityMapPeekActions({
      level,
      activityPublished: input.activityPublished,
      joinMode: input.joinMode,
      joinRequestStatus,
      confirmedParticipantCount: input.confirmedParticipantCount,
    }),
    capabilities,
    input.activityPublished
  );

  return {
    capabilities,
    intents,
    strips: resolveStrips(input, capabilities),
    presentation,
  };
};

/** Explore map peek footer — entitlement merge + transport gating (L1 projector). */
export const projectActivityMapPeekActions = (
  policy: ActivityEngagementPolicyDTO,
  entitlements: ActivityViewerEntitlementsDTO | null | undefined,
  level: ActivityViewerAccessLevel
): ActivityMapPeekAction[] => {
  const gated = (actions: ActivityMapPeekAction[]) =>
    actions.filter((action) => {
      if (action.id === 'message_host') return false;
      if (action.id === 'link_rideshare') return entitlements?.canAddLinkedRide ?? false;
      if (action.id === 'offer_rideshare') return entitlements?.canOfferTransport ?? false;
      return true;
    });

  if (!entitlements) {
    return gated(policy.intents);
  }
  return mergeActivityMapPeekActionsWithEntitlements(policy.intents, entitlements, level);
};

/** Base map peek actions for explore enrich (entitlements merged in `applyActivityViewEntitlements`). */
export const resolveActivityEngagementMapPeekActionsBase = (
  input: ResolveActivityEngagementPolicyInput
): ActivityMapPeekAction[] => resolveActivityEngagementPolicy(input).intents;

/** Map peek strip flags — compute after layer-7 entitlements are on `viewerAccess`. */
export const resolveActivityEngagementMapPeekStrips = (
  input: ResolveActivityEngagementPolicyInput
): ActivityEngagementStripsDTO => resolveActivityEngagementPolicy(input).strips;
