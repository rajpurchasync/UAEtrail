import type { QueryClient } from '@tanstack/react-query';
import { isExploreMapVnextEnabled } from '../explore/exploreMapVnext';
import { invalidateActivityEngagementQueries } from '../explore/exploreMapEngagementFreshness';
import { coordinationAttentionQueryKey, myJoinedActivitiesQueryKey } from './clientQueryKeys';
import { invalidateMyParticipantIntentsQueries } from './participantIntentClientApi';
import { reloadExploreMap } from './useExploreMap';

/** After explore organize publish — plan strips, coordination, map pool (R8.3). */
export const afterOrganizeActivityPublishClientRefresh = async (
  queryClient: QueryClient,
  input: { activityId: string; linkedParticipantIntentId?: string | null }
): Promise<void> => {
  invalidateActivityEngagementQueries(queryClient, input.activityId);
  void queryClient.invalidateQueries({ queryKey: myJoinedActivitiesQueryKey });
  void queryClient.invalidateQueries({ queryKey: coordinationAttentionQueryKey });
  if (input.linkedParticipantIntentId) {
    invalidateMyParticipantIntentsQueries(queryClient);
  }
  if (!isExploreMapVnextEnabled()) {
    await reloadExploreMap(queryClient);
  }
};
