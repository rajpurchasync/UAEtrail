import { ActivityStatus, ActivityType, LocationUnlockSource, MembershipRole, NotificationType, HostApplicationStatus, RequestStatus, RewardAction, TenantBusinessMode, TenantStatus, TenantType, UserRole } from '../domain/enums.js';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { registerActivityRoute } from '../lib/activity-routes.js';
import { registerPlaceAlias } from '../lib/route-place-alias.js';
import { ApiError } from '../lib/api-error.js';
import { toLocationDto, buildActivityDto, toParticipantPreviews, toSharedRole, mapTenantBusinessMode, mapTenantType } from '../lib/mappers.js';
import { paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { viewLimiter, sensitiveDataLimiter } from '../middleware/rate-limit-instances.js';
import { validate } from '../middleware/validate.js';
import { slugify } from '../lib/slug.js';
import { createJoinOrWaitlistRequest, createRsvpParticipation } from '../services/join-request.js';
import { buildParticipationDto } from '../services/checkin.js';
import { canWithdrawRequest, withdrawReasonSchema } from '../lib/withdraw-reasons.js';
import { getVapidPublicKey } from '../lib/push.js';
import { EARN_OPPORTUNITIES, MEMBERSHIP_TIERS, REWARD_POINTS } from '../lib/rewards-config.js';
import { awardPoints, getLeaderboard, getRewardStats, getRewardSummary } from '../services/rewards.js';
import { buildLocationCreateData } from '../services/location-submit.js';
import { locationSubmitBodySchema } from '../domain/location-submit.js';
import { createAuditLog } from '../lib/audit.js';
import { findAuthUserByEmail, findAuthUserById, listAuthUsers, updateAuthUserCore, updateAuthUserProfile } from '../lib/auth-users.js';
import { formatE164Phone, isValidE164Phone } from '../lib/phone.js';
import { notifyPlatformAdmins } from '../services/admin-notifications.js';
import { notifyHostOfRequestWithdrawal } from '../services/request-notifications.js';
import {
  notifyParticipantJoinRequestSubmitted,
  notifyParticipantJoinRequestWithdrawn
} from '../services/join-request-notifications.js';
import { ensureActivityGroupChat, userCanAccessActivityGroupChat } from '../services/activity-group-chat.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import {
  assertPremiumAccess,
  buildPremiumSummary,
  checkPremiumAccess,
  locationHasPremiumContent,
  readStoredFile,
  unlockLocationForUser
} from '../services/location-premium.js';
import { listActiveLocations } from '../lib/location-query.js';
import { buildExploreMapPayload } from '../lib/explore-map.js';
import {
  PRIVATE_ACTIVITY_MESSAGE,
  resolveActivityViewerAccess,
} from '../services/activity-viewer-access.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { resolveProfileViewerAccess } from '../services/profile-viewer-access.js';
import { findMerchantProfilesByUserIds, findMerchantPublicById } from '../lib/shop-store.js';
import { env } from '../config/env.js';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import { clearRefreshCookie } from '../lib/auth-cookies.js';
import { signAccessToken } from '../lib/jwt.js';
import { deleteUserAccount, getAccountDeletionInfo } from '../services/account-deletion.js';
import { buildUserDataExport } from '../services/data-export.js';
import {
  createLocationRecord,
  findActiveLocationById,
  findActivityForRequestViewById,
  findActivityTimingById,
  findTenantByOwnerId,
  findPublicTenantProfileBySlug,
  findPublishedActivityWithPreviewsById,
  incrementActiveLocationViewCount,
  listActiveTenantMembershipsByUser,
  listActivitiesForRequestViews,
  listFeaturedPublishedActivities,
  listPopularActiveLocations,
  listPublishedActivitiesWithPreviews,
  listPublishedUpcomingActivitiesByLocation,
  listSubmittedLocationsByUser
} from '../lib/activities-store.js';
import {
  findTenantById,
  listTenantsByOwnerId,
  mergeActiveTenantsForHostStatus,
  pickActivityTenant,
  resolveOwnedProfileType,
} from '../lib/tenant-store.js';
import { findLatestHostApplicationByApplicant } from '../lib/host-applications-store.js';
import { loadHostDetailsForUser } from '../lib/host-display-details.js';
import { createParticipantIntentSchema } from '../domain/participant-intent.js';
import {
  assertSignupProfileAge,
  completeSignupProfileSchema,
  isSignupProfileComplete,
} from '../domain/user-profile.js';
import { createParticipantIntent } from '../lib/participant-intents-store.js';
import {
  cancelUserActivityRequestAndPromoteWaitlist,
  countUserActivityParticipants,
  countUserActivityRequests,
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
  findActivityRequestByIdForUser,
  listUserActivityParticipantsPaginated,
  listUserActivityRequestsPaginated,
  updateActivityRequestNote
} from '../lib/activity-engagement-store.js';
import { removePushSubscription, upsertPushSubscription } from '../lib/push-subscriptions.js';

import {
  createRequestSchema,
  eventIdParamSchema,
  listFilterSchema,
  pushSubscriptionSchema,
  requestIdParamSchema,
  rsvpSchema,
  userBriefParamSchema,
  userSearchSchema,
} from './user/schemas.js';
import { registerBuddyRoutes } from './user/registerBuddyRoutes.js';
import { registerGroupRoutes } from './user/registerGroupRoutes.js';
import { registerNotificationRoutes } from './user/registerNotificationRoutes.js';
import { registerProfileRoutes } from './user/registerProfileRoutes.js';
import { registerHostApplicationRoutes } from './user/registerHostApplicationRoutes.js';
import { registerPublicPlaceRoutes } from './user/registerPublicPlaceRoutes.js';
import { registerPublicActivityRoutes } from './user/registerPublicActivityRoutes.js';
import {
  registerMeAccountSessionRoutes,
  registerMeActivityParticipationRoutes,
} from './user/registerMeEngagementRoutes.js';

export const userRouter = Router();

userRouter.get('/push/vapid-public-key', (_req, res) => {
  const key = getVapidPublicKey();
  res.json({ data: { publicKey: key } });
});

registerPublicPlaceRoutes(userRouter);

// ─── Featured Events (upcoming, admin-selected) ────────────────────────────

// ─── Public Tenant/Operator Profile ─────────────────────────────────────────

userRouter.get('/tenants/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tenant = await findPublicTenantProfileBySlug(slug);
    if (!tenant) {
      throw new ApiError(404, 'tenant_not_found', 'Host not found.');
    }
    const ownerProfile = tenant.owner.profile;
    const hostDetails = await loadHostDetailsForUser(tenant.ownerId);

    let merchantId: string | null = null;
    let shopProducts: Array<{
      id: string;
      name: string;
      description: string | null;
      images: string[];
      priceAed: number;
      discountPercent: number | null;
    }> = [];

    const isShopTenant = tenant.businessMode === TenantBusinessMode.SHOP;

    if (isShopTenant && tenant.ownerId) {
      const merchant = (await findMerchantProfilesByUserIds([tenant.ownerId])).get(tenant.ownerId) ?? null;
      if (merchant) {
        merchantId = merchant.id;
        const publicMerchant = await findMerchantPublicById(merchant.id);
        shopProducts =
          publicMerchant?.products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description ?? null,
            images: product.images,
            priceAed: product.priceAed,
            discountPercent: product.discountPercent ?? null,
          })) ?? [];
      }
    }

    res.json({
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: mapTenantType(tenant.type),
        businessMode: mapTenantBusinessMode(tenant.businessMode),
        description: tenant.description ?? null,
        website: tenant.website ?? null,
        region: tenant.region ?? null,
        latitude: tenant.latitude ?? null,
        longitude: tenant.longitude ?? null,
        ownerId: tenant.ownerId,
        ownerName: ownerProfile?.displayName ?? tenant.owner.email,
        ownerAvatar: ownerProfile?.avatarUrl ?? null,
        ownerBio: ownerProfile?.bio ?? null,
        hostDetails,
        shopId: merchantId,
        shopProducts,
        memberCount: tenant.memberships.length,
        team: tenant.memberships.map((m) => ({
          role: m.role,
          displayName: m.user.profile?.displayName ?? m.user.email,
          avatarUrl: m.user.profile?.avatarUrl ?? null
        })),
        activities: tenant.activities.map((activity) => buildActivityDto(activity))
      }
    });
  } catch (error) {
    next(error);
  }
});

registerPublicActivityRoutes(userRouter);

const deleteAccountSchema = z.object({
  password: z.string().min(1).optional(),
  confirmPhrase: z.literal('DELETE').optional()
});

userRouter.get('/me/account/deletion-info', requireAuth, async (req, res, next) => {
  try {
    const info = await getAccountDeletionInfo(req.auth!.userId);
    res.json({ data: info });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/export', requireAuth, sensitiveDataLimiter, async (req, res, next) => {
  try {
    const data = await buildUserDataExport(req.auth!.userId);
    const filename = `uaetrail-export-${req.auth!.userId.slice(0, 8)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    next(error);
  }
});

userRouter.delete('/me/account', requireAuth, sensitiveDataLimiter, validate({ body: deleteAccountSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof deleteAccountSchema>;
    await deleteUserAccount(req.auth!.userId, body);
    clearRefreshCookie(res);
    res.json({ message: 'Your account has been deleted.' });
  } catch (error) {
    next(error);
  }
});

// ─── Trail Points / Rewards (public) ────────────────────────────────────────

userRouter.get('/rewards/catalog', (_req, res) => {
  res.json({
    data: {
      currencyName: 'Trail Points',
      membershipTiers: MEMBERSHIP_TIERS.map(({ key, name, minPoints, emoji, tagline, benefits }) => ({
        key,
        name,
        minPoints,
        emoji,
        tagline,
        benefits
      })),
      /** @deprecated use membershipTiers */
      levels: MEMBERSHIP_TIERS.map(({ key, name, minPoints }) => ({ key, name, minPoints })),
      earnOpportunities: EARN_OPPORTUNITIES.map((item) => ({
        action: item.action,
        title: item.title,
        description: item.description,
        points: item.points
      })),
      pointValues: REWARD_POINTS
    }
  });
});

userRouter.get('/rewards/stats', async (_req, res, next) => {
  try {
    const data = await getRewardStats();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/rewards/leaderboard', async (_req, res, next) => {
  try {
    const data = await getLeaderboard(10);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});


userRouter.get('/users/:userId/brief', optionalAuth, validate({ params: userBriefParamSchema }), async (req, res, next) => {
  try {
    const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
    const user = await findAuthUserById(userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }

    const visibility = normalizeProfileVisibility(user.profile?.profileVisibility);
    const access = await resolveProfileViewerAccess({
      viewerUserId: req.auth?.userId ?? null,
      targetUserId: userId,
      targetVisibility: visibility,
      isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
    });

    if (visibility === 'private' && !access.canViewFullProfile) {
      res.json({
        data: {
          id: user._id,
          displayName: 'Private member',
          avatarUrl: null,
        },
      });
      return;
    }

    res.json({
      data: {
        id: user._id,
        displayName: user.profile.displayName ?? user.email.split('@')[0],
        avatarUrl: user.profile.avatarUrl ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/users/:userId/public-profile', optionalAuth, validate({ params: userBriefParamSchema }), async (req, res, next) => {
  try {
    const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
    const { buildPublicMemberProfile } = await import('../services/public-member-profile.js');
    const profile = await buildPublicMemberProfile(userId, {
      viewerUserId: req.auth?.userId ?? null,
      isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
    });
    if (!profile) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

userRouter.use(requireAuth, requireVerifiedEmail);

registerMeActivityParticipationRoutes(userRouter);

registerProfileRoutes(userRouter);
registerNotificationRoutes(userRouter);
registerBuddyRoutes(userRouter);
registerGroupRoutes(userRouter);
registerHostApplicationRoutes(userRouter);

registerMeAccountSessionRoutes(userRouter);

// ─── User location submission (any signed-in user) ─────────────────────────

registerPlaceAlias(userRouter, 'get', '/me/locations', async (req, res, next) => {
  try {
    const locations = await listSubmittedLocationsByUser(req.auth!.userId);
    res.json({ data: locations.map((l) => toLocationDto(l)) });
  } catch (error) {
    next(error);
  }
});

registerPlaceAlias(userRouter, 'post', '/me/locations', validate({ body: locationSubmitBodySchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof locationSubmitBodySchema>;

    const created = await createLocationRecord(buildLocationCreateData(body, req.auth!.userId));

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.submit',
      entityType: 'location',
      entityId: created.id
    });

    void awardPoints({
      userId: req.auth!.userId,
      action: RewardAction.LOCATION_SUBMITTED,
      referenceId: created.id,
      label: `Submitted location: ${created.name}`
    }).catch(() => undefined);

    res.status(201).json({ data: toLocationDto(created) });
  } catch (error) {
    next(error);
  }
});

// ─── Trail Points / Rewards (authenticated) ─────────────────────────────────

userRouter.post(
  '/me/participant-intents',
  requireAuth,
  validate({ body: createParticipantIntentSchema }),
  async (req, res, next) => {
    try {
      const data = await createParticipantIntent(req.auth!.userId, req.body);
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  }
);

userRouter.get('/me/rewards', async (req, res, next) => {
  try {
    const data = await getRewardSummary(req.auth!.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
