import type {
  FriendActivityPresenceDTO,
  FriendActivityPresenceRowDTO,
  FriendSummaryDTO,
  ExploreActivityRefDTO,
  ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { listFriendsForUser } from '../lib/friend-store.js';
import {
  matchesExploreActivityDateFilter,
  parseExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '../lib/explore-activity-date-filter.js';
import { loadExploreMapItemsForMemberEngagement } from '../lib/explore-map-member-engagement.js';

const activityHostUserId = (item: ExploreMapItemDTO): string | null => {
  if (item.source !== 'activity') return null;
  return item.featuredPerson?.userId ?? item.activity?.hostUserId ?? null;
};

const memberIsParticipantOnActivity = (item: ExploreMapItemDTO, memberUserId: string): boolean =>
  (item.participantPreviews ?? []).some((preview) => preview.id === memberUserId);

const toActivityRef = (item: ExploreMapItemDTO): ExploreActivityRefDTO => ({
  exploreItemId: item.id,
  activityId: item.activity?.id ?? item.id.replace(/^activity:/, ''),
  title: item.title ?? item.activity?.title ?? 'Outing',
});

/** Friends × explore map activities visible to the viewer. */
export const buildFriendActivityPresenceRows = (
  friends: FriendSummaryDTO[],
  mapItems: ExploreMapItemDTO[],
  datePreset: ExploreActivityDatePreset
): FriendActivityPresenceRowDTO[] => {
  const visibleActivities = mapItems
    .filter((item) => item.source === 'activity' && item.activity)
    .filter((item) => matchesExploreActivityDateFilter(item, datePreset))
    .filter((item) => item.viewerAccess?.exposure !== 'none');

  return friends.map((friend) => {
    const memberUserId = friend.userId;
    const hostingItem =
      visibleActivities.find((item) => activityHostUserId(item) === memberUserId) ?? null;
    const joiningItem =
      visibleActivities.find(
        (item) => item.id !== hostingItem?.id && memberIsParticipantOnActivity(item, memberUserId)
      ) ?? null;

    return {
      friend,
      hosting: hostingItem ? toActivityRef(hostingItem) : null,
      joining: joiningItem ? toActivityRef(joiningItem) : null,
    };
  });
};

export const loadFriendActivityPresence = async (input: {
  viewerUserId: string;
  userRole?: string | null;
  datePresetRaw?: string | null;
}): Promise<FriendActivityPresenceDTO> => {
  const datePreset = parseExploreActivityDatePreset(input.datePresetRaw);
  const [buddies, mapItems] = await Promise.all([
    listFriendsForUser(input.viewerUserId),
    loadExploreMapItemsForMemberEngagement({
      viewerUserId: input.viewerUserId,
      userRole: input.userRole,
    }),
  ]);

  const rows = buildFriendActivityPresenceRows(buddies, mapItems, datePreset);
  return { rows };
};
