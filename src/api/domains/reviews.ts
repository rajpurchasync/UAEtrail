import type { MyReviewDTO, ReviewDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Place, host/shop, and activity reviews (`/reviews`, `/me/reviews`). */
export type MarketingReviewHighlightDTO = {
  id: string;
  quote: string;
  name: string;
  emirate: string | null;
  rating: number;
};

export const reviewsApi = {
  getMarketingHighlights: (limit = 4) =>
    apiRequest<{ data: MarketingReviewHighlightDTO[] }>(
      `/reviews/marketing-highlights?limit=${limit}`,
      { auth: false }
    ),

  getOrganisationReviews: (organisationId: string, page = 1) =>
    apiRequest<{
      data: ReviewDTO[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/reviews?targetType=tenant&targetId=${organisationId}&page=${page}&pageSize=20`),

  createOrganisationReview: (payload: { organisationId: string; rating: number; comment: string }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        targetType: 'tenant',
        targetId: payload.organisationId,
        rating: payload.rating,
        comment: payload.comment,
      }),
    }),

  getReviews: (
    targetType: 'location' | 'tenant' | 'activity' | 'user',
    targetId: string,
    page = 1,
    pageSize = 20
  ) =>
    apiRequest<{
      data: ReviewDTO[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/reviews?targetType=${targetType}&targetId=${targetId}&page=${page}&pageSize=${pageSize}`),

  getActivityReviews: (activityId: string, page = 1) =>
    apiRequest<{
      data: ReviewDTO[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/reviews?targetType=activity&targetId=${activityId}&page=${page}&pageSize=20`),

  /** Reviews for a public place — wire targetType remains `location`. */
  getPlaceReviews: (placeId: string, page = 1) =>
    apiRequest<{
      data: ReviewDTO[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/reviews?targetType=location&targetId=${placeId}&page=${page}&pageSize=20`),

  createReview: (payload: {
    targetType: 'location' | 'tenant' | 'activity' | 'user';
    targetId: string;
    rating: number;
    comment: string;
    activityId?: string;
  }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  createHostReview: (payload: {
    targetType: 'user' | 'tenant';
    targetId: string;
    activityId: string;
    rating: number;
    comment: string;
  }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  createActivityReview: (payload: { activityId: string; rating: number; comment: string }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        targetType: 'activity',
        targetId: payload.activityId,
        rating: payload.rating,
        comment: payload.comment,
      }),
    }),

  getMyReviews: (page = 1, pageSize = 50) =>
    apiRequest<{
      data: MyReviewDTO[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/me/reviews?page=${page}&pageSize=${pageSize}`, { auth: true }),

  updateMyReview: (reviewId: string, payload: { rating: number; comment: string }) =>
    apiRequest<{ data: MyReviewDTO }>(`/me/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),

  createPlaceReview: (payload: { placeId: string; rating: number; comment: string }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        targetType: 'location',
        targetId: payload.placeId,
        rating: payload.rating,
        comment: payload.comment,
      }),
    }),
} as const;
