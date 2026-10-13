import { useQuery } from '@tanstack/react-query';
import type { ReviewDTO } from '@uaetrail/shared-types';
import { fetchActivityReviews } from './activityReviewsClientApi';
import { activityReviewsQueryKey } from './clientQueryKeys';

export { fetchActivityReviews } from './activityReviewsClientApi';

export const useActivityReviews = (
  activityId: string | undefined,
  enabled: boolean
): { reviews: ReviewDTO[]; loading: boolean } => {
  const query = useQuery({
    queryKey: activityId ? activityReviewsQueryKey(activityId) : ['activity', '', 'reviews'],
    queryFn: () => fetchActivityReviews(activityId!),
    enabled: Boolean(activityId && enabled),
  });

  return {
    reviews: query.data ?? [],
    loading: Boolean(activityId && enabled && query.isLoading),
  };
};
