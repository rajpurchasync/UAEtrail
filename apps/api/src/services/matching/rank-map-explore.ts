import {
  scoreMapExploreActivityCore,
  type DiscoverRecommendationSignal,
} from '@uaetrail/shared-types';
import type { ActivityWithPublicRelations } from '../../lib/activity-read-assembler.js';

export type RankMapExploreActivityInput = {
  activity: ActivityWithPublicRelations;
  friendUserIds: Set<string>;
  wishlistLocationIds?: Set<string>;
  wishlistDestinationIds?: Set<string>;
  nowMs: number;
  viewerGeo?: { lat: number; lng: number } | null;
};

export type RankMapExploreActivityResult = {
  exploreItemId: string;
  score: number;
  signals: DiscoverRecommendationSignal[];
};

export const rankMapExploreActivity = (
  input: RankMapExploreActivityInput
): RankMapExploreActivityResult | null => {
  const { activity, friendUserIds, nowMs } = input;
  if (activity.activityMode === 'seeking') return null;
  if (!activity.startAt) return null;

  const startMs = activity.startAt.getTime();
  const joined = activity.participants?.length ?? 0;
  const slotsUsed = activity.participantSlotsUsed ?? activity.participants?.length ?? 0;
  const slotsLeft = activity.capacity > 0 ? activity.capacity - slotsUsed : null;
  const slotsAvailable = slotsLeft != null && slotsLeft > 0 ? slotsLeft : null;

  const hostUserId = activity.hostId ?? activity.createdById ?? null;
  const friendOnOuting =
    (hostUserId != null && friendUserIds.has(hostUserId)) ||
    (activity.participants ?? []).some((p) => friendUserIds.has(p.userId));

  const wishlistLocations = input.wishlistLocationIds;
  const wishlistDestinations = input.wishlistDestinationIds;
  const wishlistPlace = Boolean(wishlistLocations?.has(activity.locationId));
  const wishlistDestination = Boolean(
    activity.destinationId && wishlistDestinations?.has(activity.destinationId)
  );

  const pin =
    activity.meetingLat != null && activity.meetingLng != null
      ? { lat: activity.meetingLat, lng: activity.meetingLng }
      : null;

  const ranked = scoreMapExploreActivityCore({
    startAtMs: startMs,
    nowMs,
    participantCount: joined,
    slotsAvailable,
    boosts: {
      friendOnOuting,
      wishlistPlace,
      wishlistDestination: !wishlistPlace && wishlistDestination,
    },
    pin,
    viewerGeo: input.viewerGeo,
  });
  if (!ranked) return null;

  return {
    exploreItemId: `activity:${activity.id}`,
    score: ranked.score,
    signals: ranked.signals,
  };
};