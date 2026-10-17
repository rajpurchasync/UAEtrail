import type { QueryClient } from '@tanstack/react-query';
import { isExploreMapBboxEnabled } from '../explore/exploreMapBbox';
import {
  invalidateActivityEngagementQueries,
  invalidateExploreMapQueries,
  refreshExploreMapAfterActivityEngagement,
} from '../explore/exploreMapEngagementFreshness';
import {
  invalidateMyActivityJoinRequestsQueries,
  invalidateMyJoinedActivitiesQueries,
} from './planUpcomingApi';
import { reloadExploreMap } from './useExploreMap';

/** Shared post-join cache + map freshness (R8.3) — call from join modal after successful submit. */
export const afterActivityJoinClientRefresh = (
  queryClient: QueryClient,
  input: {
    activityId: string;
    participationMode: 'rsvp' | 'approval' | string | null | undefined;
    exploreMapItemId?: string | null;
  }
): void => {
  void refreshExploreMapAfterActivityEngagement(queryClient, {
    exploreItemId: input.exploreMapItemId ?? `activity:${input.activityId}`,
    activityId: input.activityId,
    participationMode: input.participationMode,
  });
  invalidateMyActivityJoinRequestsQueries(queryClient);
  if (input.participationMode === 'rsvp') {
    invalidateMyJoinedActivitiesQueries(queryClient);
  }
};

/** After withdraw/cancel join — invalidate shared queries and reload map when legacy cache is active. */
export const afterActivityWithdrawClientRefresh = async (
  queryClient: QueryClient,
  input: { activityId: string }
): Promise<void> => {
  invalidateActivityEngagementQueries(queryClient, input.activityId);
  invalidateMyJoinedActivitiesQueries(queryClient);
  invalidateMyActivityJoinRequestsQueries(queryClient);
  if (isExploreMapBboxEnabled()) {
    invalidateExploreMapQueries(queryClient);
  } else {
    await reloadExploreMap(queryClient);
  }
};

/** Host approve/decline — coordination strip, activity detail, map roster when approved (R8.3). */
export const afterHostJoinDecisionClientRefresh = async (
  queryClient: QueryClient,
  input: { activityId: string; status: 'approved' | 'rejected' }
): Promise<void> => {
  invalidateActivityEngagementQueries(queryClient, input.activityId);
  invalidateMyActivityJoinRequestsQueries(queryClient);
  if (input.status === 'approved') {
    invalidateMyJoinedActivitiesQueries(queryClient);
    if (isExploreMapBboxEnabled()) {
      invalidateExploreMapQueries(queryClient);
    } else {
      await reloadExploreMap(queryClient);
    }
  }
};
