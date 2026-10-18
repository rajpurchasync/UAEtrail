import { ReviewTargetType, RewardAction } from '../domain/enums.js';
import { reviewTargetWireToEnum, type ReviewTargetWire } from '../domain/review-target-wire.js';
import { ApiError } from '../lib/api-error.js';
import { sanitizeUserGeneratedText } from '../lib/content-moderation.js';
import { createSocialReview } from '../lib/social-reviews-store.js';
import { tierEnumToDisplay } from '../lib/membership-tier-display.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { assertViewerCanReviewActivity } from './activity-review-gate.js';
import { getAuthUserMembershipTier, findAuthUserById } from './member-identity-read.js';
import { awardPoints } from './rewards.js';

export const createMemberReview = async (input: {
  userId: string;
  targetType: ReviewTargetWire;
  targetId: string;
  rating: number;
  comment: string;
}) => {
  const sanitizedComment = sanitizeUserGeneratedText(input.comment).trim();
  if (sanitizedComment.length < 10) {
    throw new ApiError(400, 'invalid_comment_content', 'Comment cannot contain only links or phone numbers.');
  }

  const domainType = reviewTargetWireToEnum(input.targetType);
  if (domainType === ReviewTargetType.ACTIVITY) {
    await assertViewerCanReviewActivity(input.userId, input.targetId);
  }

  const review = await createSocialReview({
    targetType: domainType,
    targetId: input.targetId,
    userId: input.userId,
    rating: input.rating,
    comment: sanitizedComment,
  });

  scheduleSideEffect(
    awardPoints({
      userId: input.userId,
      action: RewardAction.REVIEW_WRITTEN,
      referenceId: review.id,
    }),
    'review.written_rewards'
  );

  const author = await findAuthUserById(input.userId);
  const authorMembershipTier = await getAuthUserMembershipTier(input.userId);

  return {
    id: review.id,
    targetType: input.targetType,
    targetId: review.targetId,
    userId: review.userId,
    userName: author?.profile.displayName ?? author?.email.split('@')[0],
    userAvatar: author?.profile.avatarUrl ?? null,
    userMembershipTier: tierEnumToDisplay(authorMembershipTier),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
};
