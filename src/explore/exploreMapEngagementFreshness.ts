import type { QueryClient } from '@tanstack/react-query';
import { isExploreMapVnextEnabled } from './exploreMapVnext';
import {
  activityDetailQueryKey,
  coordinationAttentionQueryKey,
} from '../hooks/clientQueryKeys';
import {
  exploreMapQueryKeyPrefix,
  patchExploreMapItemInCache,
  reloadExploreMap,
} from '../hooks/useExploreMap';

/** Scoped map caches (R5.4 / R8.3) — active viewport queries refetch without legacy full reload. */
export const invalidateExploreMapQueries = (queryClient: QueryClient): void => {
  void queryClient.invalidateQueries({ queryKey: exploreMapQueryKeyPrefix });
};

/** Coordination strip + activity detail/join context (R8.2 / R8.3). */
export const invalidateActivityEngagementQueries = (
  queryClient: QueryClient,
  activityId: string
): void => {
  void queryClient.invalidateQueries({ queryKey: coordinationAttentionQueryKey });
  void queryClient.invalidateQueries({ queryKey: activityDetailQueryKey(activityId) });
};

const activityIdFromExploreItemId = (exploreItemId: string | null | undefined): string | null => {
  if (!exploreItemId?.trim()) return null;
  const trimmed = exploreItemId.trim();
  if (!trimmed.startsWith('activity:')) return null;
  const id = trimmed.slice('activity:'.length).trim();
  return id.length > 0 ? id : null;
};

const decrementSlots = (value: number | undefined): number | undefined =>
  value != null ? Math.max(0, value - 1) : value;

/** Optimistic map card update after open RSVP ("I'm going") from explore peek. */
export const patchExploreMapSlotsAfterRsvp = (
  queryClient: QueryClient,
  exploreItemId: string
): void => {
  patchExploreMapItemInCache(queryClient, exploreItemId, (item) => {
    const nextSlots = decrementSlots(item.slotsAvailable ?? item.activity?.slotsAvailable);
    if (nextSlots === item.slotsAvailable && nextSlots === item.activity?.slotsAvailable) {
      return item;
    }
    return {
      ...item,
      slotsAvailable: nextSlots ?? item.slotsAvailable,
      activity: item.activity
        ? {
            ...item.activity,
            slotsAvailable: nextSlots ?? item.activity.slotsAvailable,
          }
        : item.activity,
    };
  });
};

export const refreshExploreMapAfterActivityEngagement = async (
  queryClient: QueryClient,
  input: {
    exploreItemId: string | null | undefined;
    activityId?: string | null | undefined;
    participationMode: 'rsvp' | 'approval' | string | null | undefined;
  }
): Promise<void> => {
  const activityId =
    input.activityId?.trim() || activityIdFromExploreItemId(input.exploreItemId) || null;

  if (activityId) {
    invalidateActivityEngagementQueries(queryClient, activityId);
  }

  if (!input.exploreItemId || input.participationMode !== 'rsvp') {
    if (isExploreMapVnextEnabled() && input.participationMode === 'approval') {
      invalidateExploreMapQueries(queryClient);
    }
    return;
  }

  patchExploreMapSlotsAfterRsvp(queryClient, input.exploreItemId);

  if (!isExploreMapVnextEnabled()) {
    await reloadExploreMap(queryClient);
  }
};
