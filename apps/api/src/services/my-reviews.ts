import {
  organisationProfilePath,
  placeDetailPath,
  shopPublicPath,
} from '@uaetrail/shared-types';
import { ReviewTargetType, TenantBusinessMode } from '../domain/enums.js';
import { findLocationInMongo } from '../lib/entity-sync.js';
import { findMerchantProfileByTenantId } from '../lib/shop-store.js';
import {
  listSocialReviewsByUserId,
  updateSocialReviewForUser,
  type SocialReview,
} from '../lib/social-data.js';
import { findTenantById } from '../lib/tenant-store.js';
import { tierEnumToDisplay } from '../lib/membership-tier-display.js';
import { findAuthUserById, getAuthUserMembershipTier } from '../lib/auth-users.js';
import { ApiError } from '../lib/api-error.js';

const reviewsHash = '#reviews';

const resolveTargetMeta = async (
  review: Pick<SocialReview, 'targetType' | 'targetId'>
): Promise<{ targetLabel: string; targetPath: string }> => {
  if (review.targetType === ReviewTargetType.LOCATION) {
    const location = await findLocationInMongo(review.targetId);
    if (!location) {
      return { targetLabel: 'Place', targetPath: '/explore' };
    }
    return {
      targetLabel: location.name,
      targetPath: `${placeDetailPath(location.activityType, location.id)}${reviewsHash}`,
    };
  }

  const tenant = await findTenantById(review.targetId);
  if (!tenant) {
    return { targetLabel: 'Host or shop', targetPath: '/explore' };
  }

  if (tenant.businessMode === TenantBusinessMode.SHOP) {
    const merchant = await findMerchantProfileByTenantId(tenant.id);
    return {
      targetLabel: tenant.name,
      targetPath: `${shopPublicPath({ merchantId: merchant?.id, slug: tenant.slug })}${reviewsHash}`,
    };
  }

  const operatorPath = organisationProfilePath(tenant.slug);
  return {
    targetLabel: tenant.name,
    targetPath: operatorPath ? `${operatorPath}${reviewsHash}` : '/explore',
  };
};

const toMyReviewDto = async (
  review: SocialReview,
  author: Awaited<ReturnType<typeof findAuthUserById>>,
  membershipTier: string | null,
  target: { targetLabel: string; targetPath: string }
) => ({
  id: review.id,
  targetType: review.targetType === ReviewTargetType.LOCATION ? ('location' as const) : ('tenant' as const),
  targetId: review.targetId,
  userId: review.userId,
  userName: author?.profile.displayName ?? author?.email.split('@')[0] ?? 'You',
  userAvatar: author?.profile.avatarUrl ?? null,
  userMembershipTier: tierEnumToDisplay(membershipTier),
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt.toISOString(),
  targetLabel: target.targetLabel,
  targetPath: target.targetPath,
});

export const listMyReviews = async (input: { userId: string; skip: number; take: number }) => {
  const { items, total } = await listSocialReviewsByUserId(input);
  const author = await findAuthUserById(input.userId);
  const membershipTier = await getAuthUserMembershipTier(input.userId);

  const enriched = await Promise.all(
    items.map(async (review) => {
      const target = await resolveTargetMeta(review);
      return toMyReviewDto(review, author, membershipTier, target);
    })
  );

  return { items: enriched, total };
};

export const updateMyReview = async (input: {
  userId: string;
  reviewId: string;
  rating: number;
  comment: string;
}) => {
  const updated = await updateSocialReviewForUser({
    reviewId: input.reviewId,
    userId: input.userId,
    rating: input.rating,
    comment: input.comment,
  });
  if (!updated) {
    throw new ApiError(404, 'review_not_found', 'Review not found.');
  }

  const author = await findAuthUserById(input.userId);
  const membershipTier = await getAuthUserMembershipTier(input.userId);
  const target = await resolveTargetMeta(updated);
  return toMyReviewDto(updated, author, membershipTier, target);
};
