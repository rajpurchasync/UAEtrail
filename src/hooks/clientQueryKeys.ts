import type { QueryKey } from '@tanstack/react-query';

/**
 * R8.2 — canonical React Query keys (import here for new hooks; explore map keys live in `exploreMapQuery.ts`).
 */
export { exploreMapQueryKey, exploreMapQueryKeyPrefix } from './exploreMapQuery';

/** Plan strip + coordination surfaces (`GET /me/coordination-attention`). */
export const coordinationAttentionQueryKey = ['coordination-attention'] as const;

/** Activity detail / join-context cache (R8.2). */
export const activityDetailQueryKey = (activityId: string): QueryKey => ['activity', activityId];

export const activityReviewsQueryKey = (activityId: string): QueryKey => [
  ...activityDetailQueryKey(activityId),
  'reviews',
];
