import {
  isTimeBoundExploreMapItem,
  resolveExploreFeaturedPerson,
  type ExploreMapItemDTO,
  type SocialPeoplePreviewDTO,
} from '@uaetrail/shared-types';
import {
  matchesActivityDateFilter,
  type ExploreActivityDatePreset,
} from '@/explore/exploreActivityDateFilter';

export type SocialMapChipAvatar = {
  id: string;
  name: string;
  avatar?: string | null;
};

const SOCIAL_MAP_CHIP_AVATAR_LIMIT = 3;

const activityJoinCount = (item: ExploreMapItemDTO): number => {
  if (item.slotsTotal != null && item.slotsAvailable != null) {
    return Math.max(0, item.slotsTotal - item.slotsAvailable);
  }
  return item.participantPreviews?.length ?? 0;
};

/** Faces from live map outings — same source as legacy Who's going map pill. */
export const collectGoingPeopleFromMapItems = (
  items: ExploreMapItemDTO[],
  input: {
    excludeUserId?: string | null;
    activityDatePreset?: ExploreActivityDatePreset;
    friendUserIds?: Set<string>;
  } = {}
): SocialMapChipAvatar[] => {
  const { excludeUserId, activityDatePreset = 'anyday', friendUserIds } = input;

  const activities = items
    .filter((item) => isTimeBoundExploreMapItem(item))
    .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
    .filter(
      (item) =>
        activityJoinCount(item) > 0 || (item.participantPreviews?.length ?? 0) > 0 || item.featuredPerson
    );

  const sorted = [...activities].sort((a, b) => activityJoinCount(b) - activityJoinCount(a));
  const seen = new Set<string>();
  const friendFirst: SocialMapChipAvatar[] = [];
  const other: SocialMapChipAvatar[] = [];

  const bucket = (row: SocialMapChipAvatar) => {
    if (friendUserIds?.has(row.id)) friendFirst.push(row);
    else other.push(row);
  };

  for (const item of sorted) {
    for (const preview of item.participantPreviews ?? []) {
      const row: SocialMapChipAvatar = {
        id: preview.id,
        name: preview.name || 'Member',
        avatar: preview.avatar ?? null,
      };
      if (row.id === excludeUserId || seen.has(row.id)) continue;
      seen.add(row.id);
      bucket(row);
    }

    if ((item.participantPreviews ?? []).length === 0) {
      const featured = resolveExploreFeaturedPerson(item);
      if (featured?.userId) {
        const row: SocialMapChipAvatar = {
          id: featured.userId,
          name: featured.displayName,
          avatar: featured.avatarUrl ?? item.hostAvatar ?? null,
        };
        if (row.id !== excludeUserId && !seen.has(row.id)) {
          seen.add(row.id);
          bucket(row);
        }
      }
    }
  }

  return [...friendFirst, ...other];
};

const previewNetworkAvatars = (preview: SocialPeoplePreviewDTO | null): SocialMapChipAvatar[] =>
  (preview?.avatars ?? []).map((person) => ({
    id: person.userId,
    name: person.displayName,
    avatar: person.avatarUrl,
  }));

export const buildExploreMemberPeopleMapChip = (input: {
  preview: SocialPeoplePreviewDTO | null;
  mapItems: ExploreMapItemDTO[];
  viewerUserId?: string | null;
  activityDatePreset?: ExploreActivityDatePreset;
}): {
  avatars: SocialMapChipAvatar[];
  extraCount: number;
  friendCount: number;
} => {
  const friendUserIds = new Set(input.preview?.friendUserIds ?? []);
  const network = previewNetworkAvatars(input.preview);
  const going = collectGoingPeopleFromMapItems(input.mapItems, {
    excludeUserId: input.viewerUserId,
    activityDatePreset: input.activityDatePreset,
    friendUserIds,
  });

  const merged: SocialMapChipAvatar[] = [];
  const seen = new Set<string>();

  for (const row of [...network, ...going]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
    if (merged.length >= SOCIAL_MAP_CHIP_AVATAR_LIMIT) break;
  }

  const allUniqueCount = new Set([...network.map((r) => r.id), ...going.map((r) => r.id)]).size;

  const friendCount = input.preview?.friendCount ?? 0;

  return {
    avatars: merged,
    extraCount: Math.max(0, allUniqueCount - merged.length),
    friendCount,
  };
};
