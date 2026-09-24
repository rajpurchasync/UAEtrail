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

registerActivityRoute(userRouter, 'get', '/featured', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const events = await listFeaturedPublishedActivities(limit);
    res.json({
      data: events.map((event) => buildActivityDto(event))
    });
  } catch (error) {
    next(error);
  }
});

registerActivityRoute(userRouter, 'get', '', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const whenRaw = typeof req.query.when === 'string' ? req.query.when : 'upcoming';
    const when = whenRaw === 'past' || whenRaw === 'all' ? whenRaw : 'upcoming';
    const { items: events, total } = await listPublishedActivitiesWithPreviews({
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
      when
    });

    res.json(paginatedResponse(
      events.map((event) => buildActivityDto(event)),
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

registerActivityRoute(userRouter, 'get', '/:id', optionalAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const event = await findPublishedActivityWithPreviewsById(id);

    if (!event) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }

    const access = await resolveActivityViewerAccess({
      viewerUserId: req.auth?.userId ?? null,
      activity: {
        id: event.id,
        tenantId: event.tenantId,
        hostId: event.hostId,
        createdById: event.createdById,
        joinMode: event.joinMode,
        requirements: event.requirements,
      },
      isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
    });

    if (!access.canViewFullActivity) {
      res.json({
        data: {
          visibilityState: 'private',
          id: event.id,
          joinMode: 'private',
          message: PRIVATE_ACTIVITY_MESSAGE,
        },
      });
      return;
    }

    let myParticipation = null;
    let myRequest = null;
    if (req.auth?.userId) {
      const mine = event.participants.find((p) => p.userId === req.auth!.userId);
      if (mine) {
        myParticipation = buildParticipationDto(event, mine);
      }
      const requestRow = await findActivityRequestByEventAndUser(id, req.auth.userId);
      if (requestRow) {
        const status = requestRow.status.toLowerCase();
        myRequest = {
          id: requestRow.id,
          status,
          canWithdraw: canWithdrawRequest(status)
        };
      }
    }

    let linkedCarpool = null;
    if (event.linkedCarpoolActivityId) {
      const linkedEvent = await findPublishedActivityWithPreviewsById(event.linkedCarpoolActivityId);
      if (linkedEvent) {
        linkedCarpool = buildActivityDto(linkedEvent);
      }
    }

    let linkedParentActivity = null;
    if (event.linkedActivityId) {
      const parentEvent = await findPublishedActivityWithPreviewsById(event.linkedActivityId);
      if (parentEvent) {
        linkedParentActivity = {
          id: parentEvent.id,
          title: parentEvent.title,
          activityType: buildActivityDto(parentEvent).activityType,
        };
      }
    }

    res.json({
      data: {
        visibilityState: 'full',
        ...buildActivityDto(event),
        linkedCarpool,
        linkedParentActivity,
        organizerId: event.hostId ?? event.tenant.ownerId,
        participants: toParticipantPreviews(event.participants),
        location: toLocationDto(event.location),
        myParticipation,
        myRequest
      }
    });
  } catch (error) {
    next(error);
  }
});

registerActivityRoute(
  userRouter,
  'post',
  '/:id/requests',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: eventIdParamSchema, body: createRequestSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const { note, selectedPackageIndex } = req.body as z.infer<typeof createRequestSchema>;

      const { request, waitlisted } = await createJoinOrWaitlistRequest({
        activityId: id,
        userId: req.auth!.userId,
        note,
        selectedPackageIndex
      });

      void notifyParticipantJoinRequestSubmitted({
        userId: req.auth!.userId,
        activityId: id,
        requestId: request.id,
        waitlisted
      });

      res.status(201).json({
        data: {
          id: request.id,
          activityId: request.activityId,
          userId: request.userId,
          status: request.status.toLowerCase(),
          waitlisted,
          note: request.note,
          organizerNote: request.organizerNote,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

registerActivityRoute(
  userRouter,
  'post',
  '/:id/rsvp',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: eventIdParamSchema, body: rsvpSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const { selectedPackageIndex } = req.body as z.infer<typeof rsvpSchema>;

      const { request, participation } = await createRsvpParticipation({
        activityId: id,
        userId: req.auth!.userId,
        selectedPackageIndex
      });

      const eventDoc = await findActivityDocInMongo(id);
      const participationDto = eventDoc
        ? buildParticipationDto(eventDoc, participation)
        : buildParticipationDto(
            { startAt: new Date(), endAt: null, status: ActivityStatus.PUBLISHED },
            participation
          );

      res.status(201).json({
        data: {
          request: {
            id: request.id,
            activityId: request.activityId,
            userId: request.userId,
            status: request.status.toLowerCase(),
            note: request.note,
            organizerNote: request.organizerNote,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
          },
          participation: participationDto
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

const updateRequestNoteSchema = z.object({
  note: z.string().max(500)
});

registerActivityRoute(
  userRouter,
  'patch',
  '/:id/requests/:requestId/cancel',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: requestIdParamSchema, body: withdrawReasonSchema }),
  async (req, res, next) => {
    try {
      const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
      const { reason, message } = req.body as z.infer<typeof withdrawReasonSchema>;
      const request = await findActivityRequestByIdForUser(requestId, req.auth!.userId);
      if (!request) {
        throw new ApiError(404, 'request_not_found', 'Request not found.');
      }
      if (!canWithdrawRequest(request.status.toLowerCase())) {
        throw new ApiError(400, 'request_not_cancellable', 'This request cannot be cancelled.');
      }

      const wasConfirmed = request.status.toLowerCase() === 'approved';

      await cancelUserActivityRequestAndPromoteWaitlist({
        requestId: request.id,
        activityId: request.activityId,
        userId: req.auth!.userId,
        cancelReason: reason,
        cancelMessage: message?.trim() || null
      });

      void notifyHostOfRequestWithdrawal({
        activityId: request.activityId,
        requestId: request.id,
        participantUserId: req.auth!.userId,
        cancelReason: reason,
        cancelMessage: message?.trim() || null
      });

      void notifyParticipantJoinRequestWithdrawn({
        userId: req.auth!.userId,
        activityId: request.activityId,
        requestId: request.id,
        wasConfirmed
      });

      res.json({ message: 'Request cancelled successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

registerActivityRoute(
  userRouter,
  'patch',
  '/:id/requests/:requestId',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: requestIdParamSchema, body: updateRequestNoteSchema }),
  async (req, res, next) => {
    try {
      const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
      const { note } = req.body as z.infer<typeof updateRequestNoteSchema>;
      const request = await findActivityRequestByIdForUser(requestId, req.auth!.userId);
      if (!request) {
        throw new ApiError(404, 'request_not_found', 'Request not found.');
      }
      if (request.status !== RequestStatus.PENDING) {
        throw new ApiError(400, 'request_not_editable', 'Only pending requests can be updated.');
      }
      const updated = await updateActivityRequestNote(request.id, note);
      res.json({ data: { id: updated.id, note: updated.note } });
    } catch (error) {
      next(error);
    }
  }
);

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

registerActivityRoute(
  userRouter,
  'get',
  '/:id/group-chat',
  validate({ params: eventIdParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const allowed = await userCanAccessActivityGroupChat({
        activityId: id,
        userId: req.auth!.userId
      });
      if (!allowed) {
        throw new ApiError(403, 'forbidden', 'You cannot access this activity chat.');
      }

      const groupId = await ensureActivityGroupChat(id);
      if (!groupId) {
        throw new ApiError(404, 'group_chat_unavailable', 'Activity chat is not available.');
      }

      res.json({ data: { groupId } });
    } catch (error) {
      next(error);
    }
  }
);

const meRequestIdParamSchema = z.object({ requestId: z.string().min(1) });

const mapMeRequest = (
  request: {
    id: string;
    status: RequestStatus;
    note: string | null;
    organizerNote: string | null;
    cancelReason: string | null;
    cancelMessage: string | null;
    cancelledAt: Date | null;
    createdAt: Date;
  },
  event: Parameters<typeof buildActivityDto>[0]
) => {
  const activity = buildActivityDto(event);
  return {
    id: request.id,
    status: request.status.toLowerCase(),
    note: request.note,
    organizerNote: request.organizerNote,
    cancelReason: request.cancelReason,
    cancelMessage: request.cancelMessage,
    cancelledAt: request.cancelledAt?.toISOString() ?? null,
    createdAt: request.createdAt,
    activity: {
      id: activity.id,
      title: activity.title,
      locationName: activity.locationName,
      date: activity.date,
      time: activity.time,
      hostName: activity.hostName,
      hostUserId: activity.hostUserId,
      tenantName: activity.tenantName,
      tenantSlug: activity.tenantSlug,
    },
  };
};

userRouter.get('/me/requests/:requestId', validate({ params: meRequestIdParamSchema }), async (req, res, next) => {
  try {
    const { requestId } = req.params as z.infer<typeof meRequestIdParamSchema>;
    const request = await findActivityRequestByIdForUser(requestId, req.auth!.userId);
    if (!request) {
      throw new ApiError(404, 'request_not_found', 'Request not found.');
    }

    const activity = await findActivityForRequestViewById(request.activityId);
    if (!activity) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }

    res.json({
      data: mapMeRequest(request, activity)
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/requests', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const [requests, total] = await Promise.all([
      listUserActivityRequestsPaginated({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countUserActivityRequests(req.auth!.userId)
    ]);

    const activityIds = [...new Set(requests.map((request) => request.activityId))];
    const activities = activityIds.length > 0 ? await listActivitiesForRequestViews(activityIds) : [];
    const activityMap = new Map(activities.map((activity) => [activity.id, activity]));

    const requestViews = requests.reduce<Array<ReturnType<typeof mapMeRequest>>>((acc, request) => {
      const activity = activityMap.get(request.activityId);
      if (!activity) return acc;
      acc.push(mapMeRequest(request, activity));
      return acc;
    }, []);

    res.json(paginatedResponse(
      requestViews,
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

const listMyActivitiesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const [participantEntries, total] = await Promise.all([
      listUserActivityParticipantsPaginated({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countUserActivityParticipants(req.auth!.userId)
    ]);

    const eventIds = [...new Set(participantEntries.map((entry) => entry.activityId))];
    const events = eventIds.length > 0 ? await listActivitiesForRequestViews(eventIds) : [];
    const eventMap = new Map(events.map((event) => [event.id, event]));

    const activityViews = participantEntries.reduce<Array<ReturnType<typeof buildActivityDto> & { participation: ReturnType<typeof buildParticipationDto> }>>((acc, entry) => {
      const event = eventMap.get(entry.activityId);
      if (!event) return acc;
      acc.push({
        ...buildActivityDto(event),
        participation: buildParticipationDto(event, entry)
      });
      return acc;
    }, []);

    res.json(paginatedResponse(
      activityViews,
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
};

userRouter.get('/me/activities', listMyActivitiesHandler);

registerProfileRoutes(userRouter);
registerNotificationRoutes(userRouter);
registerBuddyRoutes(userRouter);
registerGroupRoutes(userRouter);
registerHostApplicationRoutes(userRouter);

userRouter.post('/me/push-subscriptions', validate({ body: pushSubscriptionSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof pushSubscriptionSchema>;
    const sub = await upsertPushSubscription({
      userId: req.auth!.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth
    });
    res.status(201).json({ data: { id: sub.id } });
  } catch (error) {
    next(error);
  }
});

userRouter.delete('/me/push-subscriptions', validate({ body: z.object({ endpoint: z.string().url() }) }), async (req, res, next) => {
  try {
    const { endpoint } = req.body as { endpoint: string };
    await removePushSubscription({ userId: req.auth!.userId, endpoint });
    res.json({ message: 'Push subscription removed.' });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/tenants', async (req, res, next) => {
  try {
    const memberships = await listActiveTenantMembershipsByUser(req.auth!.userId);

    res.json({
      data: memberships.map((membership) => ({
        tenantId: membership.tenantId,
        tenantName: membership.tenant.name,
        tenantSlug: membership.tenant.slug,
        tenantType: membership.tenant.type.toLowerCase(),
        membershipRole: membership.role.toLowerCase()
      }))
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/host-status', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const user = await findAuthUserById(userId);
    const role = user?.role ?? UserRole.PARTICIPANT;
    const isHostRole =
      role === UserRole.TENANT_OWNER ||
      role === UserRole.TENANT_ADMIN ||
      role === UserRole.TENANT_GUIDE;
    const isPlatformAdmin = role === UserRole.PLATFORM_ADMIN;

    const [ownedByOwnerId, memberships] = await Promise.all([
      listTenantsByOwnerId(userId),
      listActiveTenantMembershipsByUser(userId),
    ]);
    const ownedTenants = mergeActiveTenantsForHostStatus(ownedByOwnerId, memberships);
    const ownedProfiles = ownedTenants.map((tenant) => ({
      type: resolveOwnedProfileType(tenant),
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    }));

    const hasGuideProfile = ownedProfiles.some((profile) => profile.type === 'guide');
    const hasAgencyProfile = ownedProfiles.some((profile) => profile.type === 'agency');
    const hasShopProfile = ownedProfiles.some((profile) => profile.type === 'shop');

    const activityTenant = pickActivityTenant(ownedTenants);
    const tenantId = activityTenant?.id ?? null;

    const application = await findLatestHostApplicationByApplicant(userId);
    let applicationStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
    if (application) {
      const normalized = application.status.toLowerCase();
      if (normalized === 'pending' || normalized === 'approved' || normalized === 'rejected') {
        applicationStatus = normalized;
      }
    }

    const canPublish =
      isPlatformAdmin || ((isHostRole || ownedTenants.length > 0) && (hasGuideProfile || hasAgencyProfile));

    let tenantType: 'company' | 'guide_owned' | null = null;
    let businessMode: 'agency' | 'shop' | null = null;
    if (activityTenant) {
      tenantType = activityTenant.type === TenantType.COMPANY ? 'company' : 'guide_owned';
      businessMode =
        activityTenant.businessMode === TenantBusinessMode.AGENCY
          ? 'agency'
          : activityTenant.businessMode === TenantBusinessMode.SHOP
            ? 'shop'
            : null;
    }

    const canHostPaidActivities = isPlatformAdmin || hasAgencyProfile;

    res.json({
      data: {
        canPublish,
        applicationStatus,
        tenantId,
        isHostRole,
        hasTenant: ownedTenants.length > 0,
        tenantType,
        businessMode,
        canHostPaidActivities,
        hasGuideProfile,
        hasAgencyProfile,
        hasShopProfile,
        ownedProfiles
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── User Search (for starting new conversations) ──────────────────────────

userRouter.get('/users/search', validate({ query: userSearchSchema }), async (req, res, next) => {
  try {
    const { q } = req.query as z.infer<typeof userSearchSchema>;
    const currentUserId = req.auth!.userId;

    const users = (await listAuthUsers({ status: 'ACTIVE', search: q, take: 20 })).filter((u) => u._id !== currentUserId).slice(0, 10);

    res.json({
      data: users.map((u) => ({
        id: u._id,
        displayName: u.profile.displayName ?? null,
        avatarUrl: u.profile.avatarUrl ?? null
      }))
    });
  } catch (error) {
    next(error);
  }
});

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
