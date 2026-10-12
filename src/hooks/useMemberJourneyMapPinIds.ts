import { useMemo } from 'react';
import { useJoinedUpcomingPlanData } from './useJoinedUpcomingPlanData';

/** Explore “my outings” map filter — joined/hosted activities + wishlist place pins (not Trips tab UI). */
export const useMemberJourneyMapPinIds = (userId: string | undefined) => {
  const enabled = Boolean(userId);
  const { activities, requests, loading, error } = useJoinedUpcomingPlanData(enabled);

  const ids = useMemo(() => {
    if (!enabled) return null;
    const pinIds = new Set<string>();
    for (const activity of activities) {
      pinIds.add(`activity:${activity.id}`);
    }
    for (const request of requests) {
      if (request.activity?.id) pinIds.add(`activity:${request.activity.id}`);
    }
    return pinIds;
  }, [enabled, activities, requests]);

  return {
    ids,
    loading: enabled && loading,
    error: error ?? null,
  };
};
