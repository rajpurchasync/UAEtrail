import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../api/domains/reviews';
import { useApiHealth } from './useApiHealth';

export type HomeMarketingReviewCard = {
  quote: string;
  name: string;
  emirate: string;
};

const homeMarketingReviewsQueryKey = ['reviews', 'marketing-highlights'] as const;

const fetchHomeMarketingReviews = async (): Promise<HomeMarketingReviewCard[]> => {
  const res = await reviewsApi.getMarketingHighlights(4);
  return res.data.map((row) => ({
    quote: row.quote,
    name: row.name,
    emirate: row.emirate?.trim() || 'UAE',
  }));
};

/** Guest home review carousel — `GET /reviews/marketing-highlights`; empty when none in DB. */
export const useHomeMarketingReviews = () => {
  const { isSuccess: apiReady } = useApiHealth();
  const { data = [], isLoading, isError } = useQuery({
    queryKey: homeMarketingReviewsQueryKey,
    queryFn: fetchHomeMarketingReviews,
    staleTime: 5 * 60_000,
    enabled: apiReady,
    retry: 1,
  });

  return {
    reviews: data,
    loading: apiReady && isLoading,
    error: isError,
  };
};