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
    ? input.isProMember || input.isFriendOfHost
    : true;

  return {
    isProMember: input.isProMember,
    canViewHostProfileBeforeJoin,
    canViewFullBuddyRoster: input.isProMember || isHostLevel,
    canOfferTransport: input.isProMember && (joinedParticipant || input.level === 'host'),
    canAddLinkedRide: input.isProMember && input.level === 'host',
    canMessageHostBeforeJoin: canViewHostProfileBeforeJoin,
    buddyUserIdsOnActivity: input.buddyUserIdsOnActivity,
  };
};

export const mergeActivityMapPeekActionsWithEntitlements = (
  actions: ActivityMapPeekAction[],
  entitlements: ActivityViewerEntitlementsDTO,
  level: ActivityViewerAccessLevel
): ActivityMapPeekAction[] => {
  const transportGated = actions.filter(
    (action) => action.id !== 'link_carpool' || entitlements.canAddLinkedRide
  );
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
