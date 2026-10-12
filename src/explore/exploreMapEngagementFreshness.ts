import type { QueryClient } from '@tanstack/react-query';
import { isExploreMapVnextEnabled } from './exploreMapVnext';
import {
  activityDetailQueryKey,
  coordinationAttentionQueryKey,
} from '../hooks/clientQueryKeys';
import {
  patchExploreMapItemInCache,
  reloadExploreMap,
} from '../hooks/useExploreMap';

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

  void queryClient.invalidateQueries({ queryKey: coordinationAttentionQueryKey });
  if (activityId) {
    void queryClient.invalidateQueries({ queryKey: activityDetailQueryKey(activityId) });
  }

  if (!input.exploreItemId || input.participationMode !== 'rsvp') return;

  patchExploreMapSlotsAfterRsvp(queryClient, input.exploreItemId);

  if (!isExploreMapVnextEnabled()) {
    await reloadExploreMap(queryClient);
  }
};
