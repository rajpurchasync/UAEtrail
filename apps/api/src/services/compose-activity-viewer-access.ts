import type { ActivityViewerAccessDTO } from '@uaetrail/shared-types';
import { listFriendsForUser } from '../lib/friend-store.js';
import {
  applyActivityViewEntitlements,
  type ActivityViewEntitlementActivityContext,
  type ActivityViewEntitlementLoadInput,
  type MemberEntitlementContext,
} from './member-entitlements.js';
import {
  buildActivityViewerAccess,
  type ActivityViewerAccessInput,
} from './activity-viewer-access.js';

const loadActivityViewEntitlementContext = async (
  viewerUserId: string,
  input: ActivityViewEntitlementLoadInput
): Promise<ActivityViewEntitlementActivityContext> => {
  const friends = await listFriendsForUser(viewerUserId);
  const friendSet = new Set(friends.map((friend) => friend.userId));
  const hostUserId = input.hostUserId;
  const isFriendOfHost =
    hostUserId !== null && hostUserId !== undefined && friendSet.has(hostUserId);

  return {
    hostUserId,
    isFriendOfHost,
    friendUserIdsOnActivity: input.participantUserIds.filter((id) => friendSet.has(id)),
  };
};

const isResolvedEntitlementActivityContext = (
  value: ActivityViewEntitlementLoadInput | ActivityViewEntitlementActivityContext
): value is ActivityViewEntitlementActivityContext => 'isFriendOfHost' in value;

/**
 * Social viewer access (layers 3–6) then entitlement policy (layer 7).
 * Pass `entitlementActivity` with host + participant ids — friends context loads here (not from routes).
 */
export const composeActivityViewerAccess = async (
  input: ActivityViewerAccessInput,
  entitlementCtx: MemberEntitlementContext,
  entitlementActivity?: ActivityViewEntitlementLoadInput | ActivityViewEntitlementActivityContext
): Promise<ActivityViewerAccessDTO> => {
  const socialAccess = await buildActivityViewerAccess(input);

  let activityCtx: ActivityViewEntitlementActivityContext | undefined;
  if (entitlementActivity) {
    if (isResolvedEntitlementActivityContext(entitlementActivity)) {
      activityCtx = entitlementActivity;
    } else if (entitlementCtx.viewerUserId) {
      activityCtx = await loadActivityViewEntitlementContext(
        entitlementCtx.viewerUserId,
        entitlementActivity
      );
    }
  }

  return applyActivityViewEntitlements(entitlementCtx, socialAccess, activityCtx);
};
