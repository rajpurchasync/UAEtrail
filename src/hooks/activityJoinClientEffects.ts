import type { QueryClient } from '@tanstack/react-query';
import { refreshExploreMapAfterActivityEngagement } from '../explore/exploreMapEngagementFreshness';

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
};
