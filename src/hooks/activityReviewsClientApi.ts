import type { ReviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchActivityReviews = async (activityId: string): Promise<ReviewDTO[]> => {
  const res = await api.getActivityReviews(activityId);
  return res.data;
};
