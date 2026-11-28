import type { ReviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export type ReviewSubmitTarget =
  | { kind: 'activity'; activityId: string }
  | { kind: 'tenant'; organisationId: string; activityId?: string }
  | { kind: 'place'; placeId: string }
  | { kind: 'user'; userId: string; activityId: string };

export const submitEntityReview = async (
  target: ReviewSubmitTarget,
  input: { rating: number; comment: string }
): Promise<ReviewDTO> => {
  if (target.kind === 'activity') {
    const res = await api.createActivityReview({
      activityId: target.activityId,
      rating: input.rating,
      comment: input.comment,
    });
    return res.data;
  }
  if (target.kind === 'tenant') {
    if (target.activityId) {
      const res = await api.createHostReview({
        targetType: 'tenant',
        targetId: target.organisationId,
        activityId: target.activityId,
        rating: input.rating,
        comment: input.comment,
      });
      return res.data;
    }
    const res = await api.createTenantStorefrontReview({
      tenantId: target.organisationId,
      rating: input.rating,
      comment: input.comment,
    });
    return res.data;
  }
  if (target.kind === 'user') {
    const res = await api.createHostReview({
      targetType: 'user',
      targetId: target.userId,
      activityId: target.activityId,
      rating: input.rating,
      comment: input.comment,
    });
    return res.data;
  }
  const res = await api.createPlaceReview({
    placeId: target.placeId,
    rating: input.rating,
    comment: input.comment,
  });
  return res.data;
};
