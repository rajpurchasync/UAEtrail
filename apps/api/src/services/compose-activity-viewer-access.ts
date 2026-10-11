import type { ActivityViewerAccessDTO } from '@uaetrail/shared-types';
import { listBuddiesForUser } from '../lib/buddy-store.js';
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
  const buddies = await listBuddiesForUser(viewerUserId);
  const buddySet = new Set(buddies.map((buddy) => buddy.userId));
  const hostUserId = input.hostUserId;
  const isFriendOfHost =
    hostUserId !== null && hostUserId !== undefined && buddySet.has(hostUserId);

  return {
    hostUserId,
    isFriendOfHost,
    buddyUserIdsOnActivity: input.participantUserIds.filter((id) => buddySet.has(id)),
  };
};

const isResolvedEntitlementActivityContext = (
  value: ActivityViewEntitlementLoadInput | ActivityViewEntitlementActivityContext
): value is ActivityViewEntitlementActivityContext => 'isFriendOfHost' in value;

/**
 * Social viewer access (layers 3–6) then entitlement policy (layer 7).
 * Pass `entitlementActivity` with host + participant ids — buddy context loads here (not from routes).
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
