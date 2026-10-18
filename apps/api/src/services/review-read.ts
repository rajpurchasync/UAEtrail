import { reviewTargetEnumToWire, reviewTargetWireToEnum, type ReviewTargetWire } from '../domain/review-target-wire.js';
import { listSocialReviews, type SocialReview } from '../lib/social-reviews-store.js';
import { tierEnumToDisplay } from '../lib/membership-tier-display.js';
import {
  findAuthUsersByIds,
  getAuthUserMembershipTiers,
} from './member-identity-read.js';

const mapReviewRow = (
  review: SocialReview,
  reviewerMap: Map<string, Awaited<ReturnType<typeof findAuthUsersByIds>>[number]>,
  tierMap: Map<string, string | null>
) => {
  const reviewer = reviewerMap.get(review.userId);
  return {
    id: review.id,
    targetType: reviewTargetEnumToWire(review.targetType),
    targetId: review.targetId,
    userId: review.userId,
    userName: reviewer?.profile.displayName ?? reviewer?.email.split('@')[0],
    userAvatar: reviewer?.profile.avatarUrl ?? null,
    userMembershipTier: tierEnumToDisplay(tierMap.get(review.userId) ?? null),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
};

export const listPublicReviews = async (input: {
  targetType: ReviewTargetWire;
  targetId: string;
  skip: number;
  take: number;
}) => {
  const domainType = reviewTargetWireToEnum(input.targetType);
  const { items: reviews, total } = await listSocialReviews({
    targetType: domainType,
    targetId: input.targetId,
    skip: input.skip,
    take: input.take,
  });
  const reviewerIds = [...new Set(reviews.map((review) => review.userId))];
  const reviewers = await findAuthUsersByIds(reviewerIds);
  const reviewerMap = new Map(reviewers.map((reviewer) => [reviewer._id, reviewer]));
  const tierMap = await getAuthUserMembershipTiers(reviewerIds);
  const rows = reviews.map((review) => mapReviewRow(review, reviewerMap, tierMap));
  return { items: rows, total };
};
