import { useMemo } from 'react';
import { useConsoleHubData } from '../console/useHubData';
import { useMyActivityJoinRequests } from './useMyActivityJoinRequests';
import { useMyJoinedActivities } from './useMyJoinedActivities';
import { useMySeekingPosts } from './useMySeekingPosts';
import { useMeWishlist } from './useMeWishlist';
import {
  countPlanActiveGoals,
  countPlanHostingUpcoming,
  countPlanJoinedUpcoming,
  countPlanSavedPlaces,
} from '../plan/planHubSummaryCounts';
import type { MemberGoalDTO } from '@uaetrail/shared-types';

type PlanHubSummaryCounts = {
  hosting: number;
  joined: number;
  goals: number;
  savedPlaces: number;
  loading: boolean;
};

export const usePlanHubSummary = (
  goals: MemberGoalDTO[],
  canHost: boolean,
  enabled: boolean,
  refreshKey = 0,
  goalsLoading = false
): PlanHubSummaryCounts => {
  const host = useConsoleHubData(enabled && canHost);
  const { intents, loading: intentsLoading } = useMySeekingPosts(enabled && canHost, refreshKey);
  const { activities, loading: joinedLoading } = useMyJoinedActivities(enabled, refreshKey);
  const { requests, loading: requestsLoading } = useMyActivityJoinRequests(enabled, refreshKey);
  const { items: wishlist, loading: wishlistLoading } = useMeWishlist(enabled, refreshKey);

  const counts = useMemo(
    () => ({
      hosting: canHost
        ? countPlanHostingUpcoming(host.activities, host.pendingRequests, intents)
        : 0,
      joined: countPlanJoinedUpcoming(activities, requests),
      goals: countPlanActiveGoals(goals),
      savedPlaces: countPlanSavedPlaces(wishlist),
    }),
    [activities, canHost, goals, host.activities, host.pendingRequests, intents, requests, wishlist]
  );

  const loading =
    enabled &&
    (goalsLoading ||
      joinedLoading ||
      requestsLoading ||
      wishlistLoading ||
      (canHost && (host.loading || intentsLoading)));

  return { ...counts, loading };
};
