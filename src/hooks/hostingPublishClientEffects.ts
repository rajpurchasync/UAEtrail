import type { QueryClient } from '@tanstack/react-query';
import { isExploreMapBboxEnabled } from '../explore/exploreMapBbox';
import { invalidateActivityEngagementQueries } from '../explore/exploreMapEngagementFreshness';
import { coordinationAttentionQueryKey, memberAvailabilityQueryKey, myJoinedActivitiesQueryKey } from './clientQueryKeys';
import { reloadExploreMap } from './useExploreMap';

/** After explore organize publish — plan strips, coordination, map pool (R8.3). */
export const afterHostingActivityPublishClientRefresh = async (
  queryClient: QueryClient,
  input: { activityId: string; userId?: string | null }
): Promise<void> => {
  invalidateActivityEngagementQueries(queryClient, input.activityId);
  void queryClient.invalidateQueries({ queryKey: myJoinedActivitiesQueryKey });
  void queryClient.invalidateQueries({ queryKey: coordinationAttentionQueryKey });
  if (input.userId) {
    void queryClient.invalidateQueries({ queryKey: memberAvailabilityQueryKey(input.userId) });
  }
  if (!isExploreMapBboxEnabled()) {
    await reloadExploreMap(queryClient);
  }
};