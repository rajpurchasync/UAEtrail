import type { QueryClient } from '@tanstack/react-query';
import { isExploreMapBboxEnabled } from '../explore/exploreMapBbox';
import { invalidateActivityEngagementQueries } from '../explore/exploreMapEngagementFreshness';
import { coordinationAttentionQueryKey, myJoinedActivitiesQueryKey } from './clientQueryKeys';
import { invalidateMySeekingPostsQueries } from './seekingClientApi';
import { reloadExploreMap } from './useExploreMap';

/** After explore organize publish — plan strips, coordination, map pool (R8.3). */
export const afterHostingActivityPublishClientRefresh = async (
  queryClient: QueryClient,
  input: { activityId: string; linkedParticipantIntentId?: string | null }
): Promise<void> => {
  invalidateActivityEngagementQueries(queryClient, input.activityId);
  void queryClient.invalidateQueries({ queryKey: myJoinedActivitiesQueryKey });
  void queryClient.invalidateQueries({ queryKey: coordinationAttentionQueryKey });
  if (input.linkedParticipantIntentId) {
    invalidateMySeekingPostsQueries(queryClient);
  }
  if (!isExploreMapBboxEnabled()) {
    await reloadExploreMap(queryClient);
  }
};
