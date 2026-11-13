import type { ActivityMapPeekAction } from './activity-map-peek-actions.js';
import type { ActivityViewerAccessLevel } from './activity-viewer-access.js';

/** Layer 7 — paid social depth on activity surfaces (not crew / host publish). */
export type ActivityViewerEntitlementsDTO = {
  isProMember: boolean;
  canViewHostProfileBeforeJoin: boolean;
  canViewFullBuddyRoster: boolean;
  canOfferTransport: boolean;
  canAddLinkedRide: boolean;
  canMessageHostBeforeJoin: boolean;
  buddyUserIdsOnActivity: string[];
};

export const computeActivityViewerEntitlements = (input: {
  isProMember: boolean;
  isFriendOfHost: boolean;
  level: ActivityViewerAccessLevel;
  canAccessCrewSurfaces: boolean;
  buddyUserIdsOnActivity: string[];
}): ActivityViewerEntitlementsDTO => {
  const isHostLevel =
    input.level === 'host' ||
    input.level === 'platform_admin' ||
    input.level === 'tenant_staff';
  const preJoin = !input.canAccessCrewSurfaces && !isHostLevel;
  const joinedParticipant =
    input.canAccessCrewSurfaces && (input.level === 'participant' || input.level === 'activity_group_member');

  const canViewHostProfileBeforeJoin = preJoin
    ? input.isProMember || input.isFriendOfHost || input.level === 'join_request'
    : true;

  /** Joined crew or host workspace — create/link a ride for this outing (publish gate still applies). */
  const canManageLinkedTransport = joinedParticipant || isHostLevel;

  return {
    isProMember: input.isProMember,
    canViewHostProfileBeforeJoin,
    canViewFullBuddyRoster: input.isProMember || isHostLevel,
    canOfferTransport: canManageLinkedTransport,
    canAddLinkedRide: canManageLinkedTransport,
    canMessageHostBeforeJoin: canViewHostProfileBeforeJoin,
    buddyUserIdsOnActivity: input.buddyUserIdsOnActivity,
  };
};

export const mergeActivityMapPeekActionsWithEntitlements = (
  actions: ActivityMapPeekAction[],
  entitlements: ActivityViewerEntitlementsDTO,
  level: ActivityViewerAccessLevel
): ActivityMapPeekAction[] => {
  const transportGated = actions.filter((action) => {
    if (action.id === 'link_rideshare') return entitlements.canAddLinkedRide;
    if (action.id === 'offer_rideshare') return entitlements.canOfferTransport;
    return true;
  });
  const withoutHostDm = transportGated.filter((action) => action.id !== 'message_host');
  const preJoinLevels: ActivityViewerAccessLevel[] = ['public', 'link_holder', 'join_request'];
  if (!preJoinLevels.includes(level) || !entitlements.canMessageHostBeforeJoin) {
    return withoutHostDm;
  }
  const hasPrimaryJoin = withoutHostDm.some(
    (action) => action.id === 'request_join' || action.id === 'pending_join'
  );
  if (!hasPrimaryJoin) return withoutHostDm;
  if (withoutHostDm.some((action) => action.id === 'message_host')) return withoutHostDm;
  return [...withoutHostDm, { id: 'message_host', prominence: 'secondary' }];
};
