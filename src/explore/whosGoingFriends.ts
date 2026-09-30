import type { BuddySummaryDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { matchesActivityDateFilter, type ExploreActivityDatePreset } from './exploreActivityDateFilter';

export type WhosGoingFriendRow = {
  buddy: BuddySummaryDTO;
  /** Friend is hosting this outing */
  hosting: ExploreMapItemDTO | null;
  /** Friend appears in participant previews (joining) */
  joining: ExploreMapItemDTO | null;
};

const hostUserId = (item: ExploreMapItemDTO): string | null => {
  if (item.source !== 'activity') return null;
  return item.featuredPerson?.userId ?? item.activity?.hostUserId ?? null;
};

const isJoiningPreview = (item: ExploreMapItemDTO, userId: string): boolean =>
  (item.participantPreviews ?? []).some((p) => p.id === userId);

export const buildWhosGoingFriendRows = (
  buddies: BuddySummaryDTO[],
  activities: ExploreMapItemDTO[],
  activityDatePreset: ExploreActivityDatePreset
): WhosGoingFriendRow[] => {
  const trips = activities
    .filter((item) => item.source === 'activity')
    .filter((item) => matchesActivityDateFilter(item, activityDatePreset));

  return buddies.map((buddy) => {
    const id = buddy.userId;
    const hosting = trips.find((item) => hostUserId(item) === id) ?? null;
    const joining =
      trips.find((item) => item.id !== hosting?.id && isJoiningPreview(item, id)) ?? null;
    return { buddy, hosting, joining };
  });
};

export const buddyIdSet = (buddies: BuddySummaryDTO[]): Set<string> =>
  new Set(buddies.map((b) => b.userId));
