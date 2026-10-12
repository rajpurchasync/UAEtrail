import type { MyReviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMyReviews = async (page = 1, pageSize = 50): Promise<MyReviewDTO[]> => {
  const res = await api.getMyReviews(page, pageSize);
  return res.data;
};

export const updateMyReviewById = async (
  reviewId: string,
  payload: { rating: number; comment: string }
): Promise<MyReviewDTO> => {
  const res = await api.updateMyReview(reviewId, payload);
  return res.data;
};
