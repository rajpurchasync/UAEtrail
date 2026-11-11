import { useQuery } from '@tanstack/react-query';
import type { ReviewDTO } from '@uaetrail/shared-types';
import { reviewsApi } from '../api/domains/reviews';

export type TenantReviewsQueryResult = {
  reviews: ReviewDTO[];
  total: number;
};

const TENANT_REVIEWS_PAGE_SIZE = 50;

export const tenantReviewsQueryKey = (tenantId: string) =>
  ['target-reviews', 'tenant', tenantId] as const;

export const targetReviewsQueryKey = (targetType: 'tenant' | 'user', targetId: string) =>
  ['target-reviews', targetType, targetId] as const;

export const useTargetReviewsQuery = (
  targetType: 'tenant' | 'user' | null,
  targetId: string | null | undefined
) =>
  useQuery({
    queryKey:
      targetType && targetId
        ? targetReviewsQueryKey(targetType, targetId)
        : ['target-reviews', 'disabled'],
    queryFn: async (): Promise<TenantReviewsQueryResult> => {
      const res = await reviewsApi.getReviews(targetType!, targetId!, 1, TENANT_REVIEWS_PAGE_SIZE);
      return { reviews: res.data, total: res.meta.total };
    },
    enabled: Boolean(targetType && targetId),
    staleTime: 60_000,
  });

export const useTenantReviewsQuery = (tenantId: string | null | undefined) =>
  useTargetReviewsQuery('tenant', tenantId);

export const summarizeReviewRatings = (
  reviews: ReviewDTO[],
  totalCount: number
): { averageRating: number; reviewCount: number } | null => {
  if (totalCount <= 0 || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, row) => acc + row.rating, 0);
  const averageRating = Math.round((sum / reviews.length) * 10) / 10;
  return { averageRating, reviewCount: totalCount };
};
