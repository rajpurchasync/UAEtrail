import type { ReviewDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export type ReviewSubmitTarget =
  | { kind: 'activity'; activityId: string }
  | { kind: 'tenant'; organisationId: string }
  | { kind: 'place'; placeId: string };

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
    const res = await api.createOrganisationReview({
      organisationId: target.organisationId,
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
