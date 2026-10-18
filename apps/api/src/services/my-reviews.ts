import {
  activityDetailPath,
  inferHostStorefrontKindFromTenantWire,
  placeDetailPath,
  resolveActivityPublisherProfilePath,
  shopPublicPath,
} from '@uaetrail/shared-types';
import { ReviewTargetType, TenantBusinessMode } from '../domain/enums.js';
import { reviewTargetEnumToWire } from '../domain/review-target-wire.js';
import { findActivityTitlesByIds } from '../lib/activities-store.js';
import { findLocationsByIds } from '../lib/entity-sync.js';
import { findMerchantProfilesByTenantIds } from '../lib/shop-store.js';
import {
  listSocialReviewsByUserId,
  updateSocialReviewForUser,
  type SocialReview,
} from '../lib/social-reviews-store.js';
import { findTenantsByIds, type TenantRecord } from '../lib/tenant-store.js';
import { tierEnumToDisplay } from '../lib/membership-tier-display.js';
import { findAuthUserById, getAuthUserMembershipTier } from '../lib/auth-users-store.js';
import { ApiError } from '../lib/api-error.js';
import type { Location } from '../domain/types.js';

const reviewsHash = '#reviews';
const EXPLORE_FALLBACK_PATH = '/explore';

type TargetMeta = { targetLabel: string; targetPath: string };

const buildReviewTargetContext = async (
  reviews: Pick<SocialReview, 'targetType' | 'targetId'>[]
) => {
  const locationIds: string[] = [];
  const activityIds: string[] = [];
  const tenantIds: string[] = [];

  for (const review of reviews) {
    if (review.targetType === ReviewTargetType.LOCATION) locationIds.push(review.targetId);
    else if (review.targetType === ReviewTargetType.ACTIVITY) activityIds.push(review.targetId);
    else tenantIds.push(review.targetId);
  }

  const [locations, activities, tenants, merchants] = await Promise.all([
    findLocationsByIds(locationIds),
    findActivityTitlesByIds(activityIds),
    findTenantsByIds([...new Set(tenantIds)]),
    findMerchantProfilesByTenantIds(tenantIds),
  ]);

  return { locations, activities, tenants, merchants };
};

const resolveTargetMetaFromContext = (
  review: Pick<SocialReview, 'targetType' | 'targetId'>,
  ctx: {
    locations: Map<string, Location>;
    activities: Map<string, string>;
    tenants: Map<string, TenantRecord>;
    merchants: Map<string, { id: string; slug?: string | null }>;
  }
): TargetMeta => {
  if (review.targetType === ReviewTargetType.LOCATION) {
    const location = ctx.locations.get(review.targetId);
    if (!location) {
      return { targetLabel: 'Place', targetPath: EXPLORE_FALLBACK_PATH };
    }
    return {
      targetLabel: location.name,
      targetPath: `${placeDetailPath(location.activityType, location.id)}${reviewsHash}`,
    };
  }

  if (review.targetType === ReviewTargetType.ACTIVITY) {
    const title = ctx.activities.get(review.targetId);
    return {
      targetLabel: title ?? 'Outing',
      targetPath: `${activityDetailPath(review.targetId)}${reviewsHash}`,
    };
  }

  const tenant = ctx.tenants.get(review.targetId);
  if (!tenant) {
    return { targetLabel: 'Host or shop', targetPath: EXPLORE_FALLBACK_PATH };
  }

  if (tenant.businessMode === TenantBusinessMode.SHOP) {
    const merchant = ctx.merchants.get(tenant.id);
    return {
      targetLabel: tenant.name,
      targetPath: `${shopPublicPath({ merchantId: merchant?.id, slug: tenant.slug })}${reviewsHash}`,
    };
  }

  const brandPath = resolveActivityPublisherProfilePath({
    publishingProfileKind: inferHostStorefrontKindFromTenantWire({
      type: tenant.type,
      businessMode: tenant.businessMode,
      publishingPurpose: tenant.publishingPurpose ?? null,
    }),
    tenantSlug: tenant.slug,
    hostUserId: tenant.ownerId,
  });
  return {
    targetLabel: tenant.name,
    targetPath: brandPath ? `${brandPath}${reviewsHash}` : EXPLORE_FALLBACK_PATH,
  };
};

const toMyReviewDto = async (
  review: SocialReview,
  author: Awaited<ReturnType<typeof findAuthUserById>>,
  membershipTier: string | null,
  target: TargetMeta
) => ({
  id: review.id,
  targetType: reviewTargetEnumToWire(review.targetType),
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
  const targetCtx = await buildReviewTargetContext(items);

  const enriched = items.map((review) =>
    toMyReviewDto(
      review,
      author,
      membershipTier,
      resolveTargetMetaFromContext(review, targetCtx)
    )
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
  const targetCtx = await buildReviewTargetContext([updated]);
  const target = resolveTargetMetaFromContext(updated, targetCtx);
  return toMyReviewDto(updated, author, membershipTier, target);
};
