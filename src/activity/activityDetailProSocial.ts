import type { ActivityViewerEntitlementsDTO } from '@uaetrail/shared-types';

export const activityDetailShowHostProfileProUpsell = (
  entitlements: ActivityViewerEntitlementsDTO | null | undefined,
  hasHostProfilePath: boolean,
  previewMode: boolean,
  isHostView: boolean
): boolean =>
  !previewMode &&
  !isHostView &&
  hasHostProfilePath &&
  Boolean(entitlements && !entitlements.canViewHostProfileBeforeJoin);

export const activityDetailShowRosterProUpsell = (
  entitlements: ActivityViewerEntitlementsDTO | null | undefined,
  canAccessCrewSurfaces: boolean,
  totalParticipantCount: number,
  visibleParticipantCount: number
): boolean =>
  canAccessCrewSurfaces &&
  Boolean(entitlements && !entitlements.canViewFullFriendRoster) &&
  totalParticipantCount > visibleParticipantCount;
