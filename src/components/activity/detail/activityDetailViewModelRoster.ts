import type { ActivityDetailDTO, ActivityViewerEntitlementsDTO } from '@uaetrail/shared-types';

type ParticipantRow = NonNullable<ActivityDetailDTO['participants']>[number];

export const filterActivityDetailRosterParticipants = (
  participants: ActivityDetailDTO['participants'],
  canAccessCrewSurfaces: boolean,
  viewerEntitlements: ActivityViewerEntitlementsDTO | null | undefined,
  showPreJoinRoster: boolean
): ParticipantRow[] => {
  const list = participants ?? [];
  if (!showPreJoinRoster) return [];
  if (canAccessCrewSurfaces) return list;
  if (!viewerEntitlements || viewerEntitlements.canViewFullFriendRoster) return list;
  const friendSet = new Set(viewerEntitlements.friendUserIdsOnActivity ?? []);
  return list.filter((row) => friendSet.has(row.id));
};