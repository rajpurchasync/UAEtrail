import { useMemo } from 'react';
import { useConsoleHubData } from '../console/useHubData';
import { useMyActivityJoinRequests } from './useMyActivityJoinRequests';
import { useMyJoinedActivities } from './useMyJoinedActivities';
import { useMemberAvailability } from './useMemberAvailability';
import { useMeWishlist } from './useMeWishlist';
import {
  countPlanActiveGoals,
  countHostingUpcomingCommitments,
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
  const availability = useMemberAvailability(enabled && canHost);
  const { activities, loading: joinedLoading } = useMyJoinedActivities(enabled, refreshKey);
  const { requests, loading: requestsLoading } = useMyActivityJoinRequests(enabled, refreshKey);
  const { items: wishlist, loading: wishlistLoading } = useMeWishlist(enabled, refreshKey);

  const counts = useMemo(
    () => ({
      hosting: canHost
        ? countHostingUpcomingCommitments(
            host.activities,
            host.pendingRequests,
            availability.data?.slots ?? []
          )
        : 0,
      joined: countPlanJoinedUpcoming(activities, requests),
      goals: countPlanActiveGoals(goals),
      savedPlaces: countPlanSavedPlaces(wishlist),
    }),
    [
      activities,
      availability.data?.slots,
      canHost,
      goals,
      host.activities,
      host.pendingRequests,
      requests,
      wishlist,
    ]
  );

  const loading =
    enabled &&
    (goalsLoading ||
      joinedLoading ||
      requestsLoading ||
      wishlistLoading ||
      (canHost && (host.loading || availability.loading)));

  return { ...counts, loading };
};