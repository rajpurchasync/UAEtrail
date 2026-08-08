import { ActivityType, LocationUnlockSource, NotificationType, OrganizerApplicationStatus, RequestStatus, RewardAction, UserRole } from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { toLocationDto, buildEventDto, toParticipantPreviews, toSharedRole } from '../lib/mappers.js';
import { paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { viewLimiter, sensitiveDataLimiter } from '../middleware/rate-limit-instances.js';
import { validate } from '../middleware/validate.js';
import { slugify } from '../lib/slug.js';
import { createJoinOrWaitlistRequestDefault } from '../services/join-request.js';
import { buildParticipationDto, performParticipantCheckInDefault } from '../services/checkin.js';
import { canWithdrawRequest, withdrawReasonSchema } from '../lib/withdraw-reasons.js';
import { getVapidPublicKey } from '../lib/push.js';
import { EARN_OPPORTUNITIES, MEMBERSHIP_TIERS, REWARD_POINTS } from '../lib/rewards-config.js';
import { awardPointsDefault, getLeaderboardDefault, getRewardStatsDefault, getRewardSummaryDefault } from '../services/rewards.js';
import { buildLocationCreateData } from '../services/location-submit.js';
import { locationSubmitBodySchema } from '../domain/location-submit.js';
import { createAuditLog } from '../lib/audit.js';
import { findAuthUserByEmail, findAuthUserById, listAuthUsers, updateAuthUserCore, updateAuthUserProfile } from '../lib/auth-users.js';
import {
  assertPremiumAccess,
  buildPremiumSummary,
  checkPremiumAccess,
  locationHasPremiumContent,
  readStoredFile,
  unlockLocationForUser
} from '../services/location-premium.js';
import { listActiveLocations } from '../lib/location-query.js';
import { env } from '../config/env.js';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import { clearRefreshCookie } from '../lib/auth-cookies.js';
import { signAccessToken } from '../lib/jwt.js';
import { deleteUserAccount, getAccountDeletionInfo } from '../services/account-deletion.js';
import { buildUserDataExport } from '../services/data-export.js';
import {
  createLocationRecord,
  findActiveLocationById,
  findEventForRequestViewById,
  findEventTimingById,
  findTenantByOwnerId,
  findPublicTenantProfileBySlug,
  findPublishedEventWithPreviewsById,
  incrementActiveLocationViewCount,
  listActiveTenantMembershipsByUser,
  listEventsForRequestViews,
  listEventsForTripViews,
  listFeaturedPublishedEvents,
  listPopularActiveLocations,
  listPublishedEventsWithPreviews,
  listPublishedUpcomingEventsByLocation,
  listSubmittedLocationsByUser
} from '../lib/events-store.js';
import {
  createOrganizerApplicationDetailed,
  findLatestOrganizerApplicationByApplicant,
  findLatestOrganizerApplicationWithApplicant,
  findPendingOrganizerApplicationByApplicant,
  updateOrganizerApplicationMetadata
} from '../lib/organizer-applications-store.js';
import {
  cancelUserEventRequestAndPromoteWaitlist,
  countUserEventParticipants,
  countUserEventRequests,
  findEventParticipantByEventAndUser,
  findEventRequestByEventAndUser,
  findEventRequestByIdForUser,
  listUserEventParticipantsPaginated,
  listUserEventRequestsPaginated,
  updateEventRequestNote
} from '../lib/event-engagement-store.js';
import { removePushSubscription, upsertPushSubscription } from '../lib/push-subscriptions.js';
import { createNotificationRecord, listUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../lib/notifications-store.js';
import {
  acceptGroupInviteByToken,
  createGroupInvite,
  createGroupWallMessage,
  createKidGroupMember,
  createSocialGroup,
  findGroupById,
  getGroupMembership,
  listGroupInvites,
  listGroupMembersDetailed,
  listGroupsForUser,
  listGroupWallMessages,
  removeGroupMembership,
  setGroupMembershipActiveState
} from '../lib/social-groups-store.js';

const eventIdParamSchema = z.object({ id: z.string().min(1) });
const requestIdParamSchema = z.object({ id: z.string().min(1), requestId: z.string().min(1) });

const createRequestSchema = z.object({
  note: z.string().max(300).optional(),
  selectedPackageIndex: z.number().int().min(0).max(11).optional()
});

const mediaUrlSchema = z.string().min(1).refine(
  (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
  { message: 'Invalid media URL' }
);

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  phone: z.string().max(30).optional(),
  bio: z.string().max(400).optional(),
  avatarUrl: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    mediaUrlSchema.optional()
  )
});

const roleSwitchSchema = z.object({
  target: z.enum(['visitor', 'original'])
});

const createGroupSchema = z.object({
  type: z.enum(['family', 'friends']),
  name: z.string().min(2).max(80),
  slogan: z.string().max(120).optional(),
  bannerUrl: mediaUrlSchema.optional(),
  photoUrl: mediaUrlSchema.optional()
});

const groupIdParamSchema = z.object({ groupId: z.string().min(1) });
const groupMembershipIdParamSchema = z.object({ groupId: z.string().min(1), membershipId: z.string().min(1) });

const groupInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['buddy', 'admin']).default('buddy')
});

const acceptInviteSchema = z.object({
  token: z.string().min(20)
});

const createKidSchema = z.object({
  displayName: z.string().min(2).max(80),
  role: z.enum(['buddy', 'admin']).optional()
});

const groupMembershipPatchSchema = z.object({
  isActive: z.boolean()
});

const createWallPostSchema = z.object({
  body: z.string().min(1).max(600)
});

const SWITCHABLE_PRIVILEGED_ROLES: UserRole[] = [
  UserRole.PLATFORM_ADMIN,
  UserRole.MERCHANT_ADMIN,
  UserRole.TENANT_OWNER,
  UserRole.TENANT_ADMIN,
  UserRole.TENANT_GUIDE
];

const listFilterSchema = z.object({
  activityType: z.enum(['hiking', 'camping']).optional(),
  featured: z.coerce.boolean().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().min(1).max(500).default(50).optional(),
  countryCode: z.string().length(2).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional()
});

export const userRouter = Router();

userRouter.get('/push/vapid-public-key', (_req, res) => {
  const key = getVapidPublicKey();
  res.json({ data: { publicKey: key } });
});

userRouter.get('/locations', validate({ query: listFilterSchema }), async (req, res, next) => {
  try {
    const filters = req.query as z.infer<typeof listFilterSchema>;
    const pg = { page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
    const { items, total } = await listActiveLocations({
      activityType: filters.activityType,
      featured: filters.featured,
      countryCode: filters.countryCode,
      lat: filters.lat,
      lng: filters.lng,
      radius: filters.radius,
      page: pg.page,
      pageSize: pg.pageSize
    });
    res.json(paginatedResponse(items.map((l) => toLocationDto(l)), total, pg));
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/popular', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const locations = await listPopularActiveLocations(limit);
    res.json({ data: locations.map((l) => toLocationDto(l)) });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/:id/events', validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const events = await listPublishedUpcomingEventsByLocation(id, 20);
    res.json({ data: events.map((event) => buildEventDto(event)) });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/:id', optionalAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const location = await findActiveLocationById(id);
    if (!location) {
      throw new ApiError(404, 'location_not_found', 'Location not found.');
    }

    const access = await checkPremiumAccess(req.auth?.userId ?? null, id, req.auth?.role);
    const premium = locationHasPremiumContent(location)
      ? buildPremiumSummary(location, access)
      : null;

    res.json({ data: toLocationDto(location), premium });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/:id/premium/guide', requireAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const location = await findActiveLocationById(id);
    if (!location) {
      throw new ApiError(404, 'location_not_found', 'Location not found.');
    }
    if (!location.guideMarkdown && !location.guidePdfKey) {
      throw new ApiError(404, 'guide_not_available', 'No guide content for this location.');
    }

    await assertPremiumAccess(req.auth!.userId, id, req.auth!.role);

    res.json({
      data: {
        locationId: id,
        locationName: location.name,
        markdown: location.guideMarkdown ?? null,
        hasPdf: Boolean(location.guidePdfKey)
      }
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/:id/premium/map/download', requireAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const location = await findActiveLocationById(id);
    if (!location) {
      throw new ApiError(404, 'location_not_found', 'Location not found.');
    }
    if (!location.gpxKey) {
      throw new ApiError(404, 'map_not_available', 'No route map file for this location.');
    }

    await assertPremiumAccess(req.auth!.userId, id, req.auth!.role);

    const file = await readStoredFile(location.gpxKey);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/:id/premium/guide/pdf', requireAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const location = await findActiveLocationById(id);
    if (!location?.guidePdfKey) {
      throw new ApiError(404, 'guide_pdf_not_available', 'No PDF guide for this location.');
    }

    await assertPremiumAccess(req.auth!.userId, id, req.auth!.role);

    const file = await readStoredFile(location.guidePdfKey);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  } catch (error) {
    next(error);
  }
});

const locationDetailPath = (location: { id: string; activityType: ActivityType }) =>
  location.activityType === ActivityType.CAMPING ? `/camp/${location.id}` : `/trail/${location.id}`;

userRouter.post('/locations/:id/premium/checkout', requireAuth, requireVerifiedEmail, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const location = await findActiveLocationById(id);
    if (!location) {
      throw new ApiError(404, 'location_not_found', 'Location not found.');
    }
    if (!locationHasPremiumContent(location)) {
      throw new ApiError(400, 'no_premium_content', 'This location has no premium map or guide content.');
    }

    const access = await checkPremiumAccess(req.auth!.userId, id, req.auth!.role);
    if (access.hasAccess) {
      res.json({
        data: {
          alreadyUnlocked: true,
          premium: buildPremiumSummary(location, access)
        }
      });
      return;
    }

    if (location.unlockPriceAed === 0) {
      const unlocked = await unlockLocationForUser(req.auth!.userId, id, LocationUnlockSource.PURCHASE);
      res.json({
        data: {
          alreadyUnlocked: false,
          premium: buildPremiumSummary(location, unlocked)
        },
        message: 'Location unlocked. Map and guide access is now available.'
      });
      return;
    }

    if (!isStripeConfigured()) {
      throw new ApiError(
        503,
        'checkout_unavailable',
        'Online payment is not available yet. Try again later or upgrade to Pro/GOAT membership.'
      );
    }

    const stripe = await getStripe();
    const returnPath = locationDetailPath(location);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${env.APP_BASE_URL}${returnPath}?unlock=success`,
      cancel_url: `${env.APP_BASE_URL}${returnPath}?unlock=cancelled`,
      client_reference_id: `${req.auth!.userId}:${id}`,
      metadata: {
        type: 'location_unlock',
        userId: req.auth!.userId,
        locationId: id
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aed',
            unit_amount: location.unlockPriceAed * 100,
            product_data: {
              name: `${location.name} — premium access`,
              description: 'One-time unlock: route map and guide for this location.'
            }
          }
        }
      ]
    });

    res.json({
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    next(error);
  }
});

/** @deprecated Use POST /locations/:id/premium/checkout */
userRouter.post('/locations/:id/premium/unlock', requireAuth, requireVerifiedEmail, validate({ params: eventIdParamSchema }), (_req, _res, next) => {
  next(new ApiError(
    402,
    'payment_required',
    'Direct unlock is disabled. Use POST /locations/:id/premium/checkout.'
  ));
});

// ─── Track Location View ────────────────────────────────────────────────────

userRouter.post('/locations/:id/view', viewLimiter, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    await incrementActiveLocationViewCount(id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ─── Featured Events (upcoming, admin-selected) ────────────────────────────

const parseOrganizerDetails = (metadata: unknown) => {
  if (!metadata || typeof metadata !== 'object') return {};
  const m = metadata as Record<string, unknown>;
  return {
    experience: typeof m.experience === 'string' ? m.experience : undefined,
    languages: typeof m.languages === 'string' ? m.languages : undefined,
    certificates: typeof m.certificates === 'string' ? m.certificates : undefined,
    notableHikes: typeof m.notableHikes === 'string' ? m.notableHikes : undefined,
    nationality: typeof m.nationality === 'string' ? m.nationality : undefined,
    residence: typeof m.residence === 'string' ? m.residence : undefined,
  };
};

const loadOrganizerDetails = async (userId: string) => {
  const application = await findLatestOrganizerApplicationByApplicant(userId);
  return parseOrganizerDetails(application?.metadata);
};

// ─── Public Tenant/Operator Profile ─────────────────────────────────────────

userRouter.get('/tenants/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tenant = await findPublicTenantProfileBySlug(slug);
    if (!tenant) {
      throw new ApiError(404, 'tenant_not_found', 'Organizer not found.');
    }
    const ownerProfile = tenant.owner.profile;
    const organizerDetails = await loadOrganizerDetails(tenant.ownerId);
    res.json({
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        ownerId: tenant.ownerId,
        ownerName: ownerProfile?.displayName ?? tenant.owner.email,
        ownerAvatar: ownerProfile?.avatarUrl ?? null,
        ownerBio: ownerProfile?.bio ?? null,
        organizerDetails,
        memberCount: tenant.memberships.length,
        team: tenant.memberships.map((m) => ({
          role: m.role,
          displayName: m.user.profile?.displayName ?? m.user.email,
          avatarUrl: m.user.profile?.avatarUrl ?? null
        })),
        events: tenant.events.map((event) => buildEventDto(event))
      }
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/events/featured', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const events = await listFeaturedPublishedEvents(limit);
    res.json({
      data: events.map((event) => buildEventDto(event))
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/events', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const { items: events, total } = await listPublishedEventsWithPreviews({
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize
    });

    res.json(paginatedResponse(
      events.map((event) => buildEventDto(event)),
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

userRouter.get('/events/:id', optionalAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const event = await findPublishedEventWithPreviewsById(id);

    if (!event) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }

    let myParticipation = null;
    let myRequest = null;
    if (req.auth?.userId) {
      const mine = event.participants.find((p) => p.userId === req.auth!.userId);
      if (mine) {
        myParticipation = buildParticipationDto(event, mine);
      }
      const requestRow = await findEventRequestByEventAndUser(id, req.auth.userId);
      if (requestRow) {
        const status = requestRow.status.toLowerCase();
        myRequest = {
          id: requestRow.id,
          status,
          canWithdraw: canWithdrawRequest(status)
        };
      }
    }

    res.json({
      data: {
        ...buildEventDto(event),
        organizerId: event.guideId ?? event.tenant.ownerId,
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

userRouter.post(
  '/events/:id/requests',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: eventIdParamSchema, body: createRequestSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const { note, selectedPackageIndex } = req.body as z.infer<typeof createRequestSchema>;

      const { request, waitlisted } = await createJoinOrWaitlistRequestDefault({
        eventId: id,
        userId: req.auth!.userId,
        note,
        selectedPackageIndex
      });

      res.status(201).json({
        data: {
          id: request.id,
          eventId: request.eventId,
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

const updateRequestNoteSchema = z.object({
  note: z.string().max(500)
});

userRouter.patch(
  '/events/:id/requests/:requestId/cancel',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: requestIdParamSchema, body: withdrawReasonSchema }),
  async (req, res, next) => {
    try {
      const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
      const { reason, message } = req.body as z.infer<typeof withdrawReasonSchema>;
      const request = await findEventRequestByIdForUser(requestId, req.auth!.userId);
      if (!request) {
        throw new ApiError(404, 'request_not_found', 'Request not found.');
      }
      if (!canWithdrawRequest(request.status.toLowerCase())) {
        throw new ApiError(400, 'request_not_cancellable', 'This request cannot be cancelled.');
      }

      await cancelUserEventRequestAndPromoteWaitlist({
        requestId: request.id,
        eventId: request.eventId,
        cancelReason: reason,
        cancelMessage: message?.trim() || null
      });

      res.json({ message: 'Request cancelled successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

userRouter.patch(
  '/events/:id/requests/:requestId',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: requestIdParamSchema, body: updateRequestNoteSchema }),
  async (req, res, next) => {
    try {
      const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
      const { note } = req.body as z.infer<typeof updateRequestNoteSchema>;
      const request = await findEventRequestByIdForUser(requestId, req.auth!.userId);
      if (!request) {
        throw new ApiError(404, 'request_not_found', 'Request not found.');
      }
      if (request.status !== RequestStatus.PENDING) {
        throw new ApiError(400, 'request_not_editable', 'Only pending requests can be updated.');
      }
      const updated = await updateEventRequestNote(request.id, note);
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

userRouter.use(requireAuth, requireVerifiedEmail);

userRouter.post('/events/:id/checkin', validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const participant = await findEventParticipantByEventAndUser(id, req.auth!.userId);
    if (!participant) {
      throw new ApiError(404, 'not_a_participant', 'You are not confirmed for this trip.');
    }

    const result = await performParticipantCheckInDefault({
      eventId: id,
      participantId: participant.id,
      actorUserId: req.auth!.userId,
      source: 'self'
    });

    const eventTiming = await findEventTimingById(id);
    if (!eventTiming) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }

    res.json({
      message: result.alreadyCheckedIn ? 'You are already checked in.' : 'Checked in successfully.',
      checkedInAt: result.checkedInAt.toISOString(),
      participation: buildParticipationDto(eventTiming, {
        id: participant.id,
        requestId: participant.requestId,
        checkedInAt: result.checkedInAt
      })
    });
  } catch (error) {
    next(error);
  }
});

const meRequestIdParamSchema = z.object({ requestId: z.string().min(1) });

const mapMeRequest = (request: {
  id: string;
  status: RequestStatus;
  note: string | null;
  organizerNote: string | null;
  cancelReason: string | null;
  cancelMessage: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  event: {
    id: string;
    title: string | null;
    startAt: Date;
    guideId: string | null;
    location: { name: string };
    tenant: { name: string; slug: string; ownerId: string };
    guide: { profile: { displayName: string | null } | null } | null;
  };
}) => ({
  id: request.id,
  status: request.status.toLowerCase(),
  note: request.note,
  organizerNote: request.organizerNote,
  cancelReason: request.cancelReason,
  cancelMessage: request.cancelMessage,
  cancelledAt: request.cancelledAt?.toISOString() ?? null,
  createdAt: request.createdAt,
  event: {
    id: request.event.id,
    title: request.event.title,
    locationName: request.event.location.name,
    date: request.event.startAt.toISOString().slice(0, 10),
    time: request.event.startAt.toISOString().slice(11, 16),
    organizerName: request.event.guide?.profile?.displayName ?? 'Host',
    hostName: request.event.guide?.profile?.displayName ?? 'Host',
    tenantName: request.event.tenant.name,
    organizerUserId: request.event.guideId ?? request.event.tenant.ownerId,
    tenantSlug: request.event.tenant.slug
  }
});

userRouter.get('/me/requests/:requestId', validate({ params: meRequestIdParamSchema }), async (req, res, next) => {
  try {
    const { requestId } = req.params as z.infer<typeof meRequestIdParamSchema>;
    const request = await findEventRequestByIdForUser(requestId, req.auth!.userId);
    if (!request) {
      throw new ApiError(404, 'request_not_found', 'Request not found.');
    }

    const event = await findEventForRequestViewById(request.eventId);
    if (!event) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }

    res.json({
      data: mapMeRequest({
        ...request,
        event
      })
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/requests', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const [requests, total] = await Promise.all([
      listUserEventRequestsPaginated({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countUserEventRequests(req.auth!.userId)
    ]);

    const eventIds = [...new Set(requests.map((request) => request.eventId))];
    const events = eventIds.length > 0 ? await listEventsForRequestViews(eventIds) : [];
    const eventMap = new Map(events.map((event) => [event.id, event]));

    const requestViews = requests.reduce<Array<ReturnType<typeof mapMeRequest>>>((acc, request) => {
      const event = eventMap.get(request.eventId);
      if (!event) return acc;
      acc.push(mapMeRequest({ ...request, event }));
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

userRouter.get('/me/trips', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const [participantEntries, total] = await Promise.all([
      listUserEventParticipantsPaginated({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countUserEventParticipants(req.auth!.userId)
    ]);

    const eventIds = [...new Set(participantEntries.map((entry) => entry.eventId))];
    const events = eventIds.length > 0 ? await listEventsForTripViews(eventIds) : [];
    const eventMap = new Map(events.map((event) => [event.id, event]));

    const tripViews = participantEntries.reduce<Array<ReturnType<typeof buildEventDto> & { participation: ReturnType<typeof buildParticipationDto> }>>((acc, entry) => {
      const event = eventMap.get(entry.eventId);
      if (!event) return acc;
      acc.push({
        ...buildEventDto(event),
        participation: buildParticipationDto(event, entry)
      });
      return acc;
    }, []);

    res.json(paginatedResponse(
      tripViews,
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/profile', async (req, res, next) => {
  try {
    const user = await findAuthUserById(req.auth!.userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }
    res.json({
      data: {
        id: user._id,
        email: user.email,
        role: user.role.toLowerCase(),
        switchedFromRole: user.profile?.switchedFromRole?.toLowerCase() ?? null,
        displayName: user.profile?.displayName,
        phone: user.profile?.phone,
        bio: user.profile?.bio,
        avatarUrl: user.profile?.avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

userRouter.patch('/me/profile', validate({ body: updateProfileSchema }), async (req, res, next) => {
  try {
    const data = req.body as z.infer<typeof updateProfileSchema>;
    await updateAuthUserProfile(req.auth!.userId, data);
    res.json({
      data: {
        displayName: data.displayName ?? null,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        avatarUrl: data.avatarUrl ?? null
      }
    });
  } catch (error) {
    next(error);
  }
});

userRouter.post('/me/role/switch', validate({ body: roleSwitchSchema }), async (req, res, next) => {
  try {
    const { target } = req.body as z.infer<typeof roleSwitchSchema>;
    const user = await findAuthUserById(req.auth!.userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }

    let nextRole = user.role;
    let switchedFromRole = user.profile?.switchedFromRole ?? null;

    if (target === 'visitor') {
      if (user.role !== UserRole.VISITOR) {
        if (!SWITCHABLE_PRIVILEGED_ROLES.includes(user.role)) {
          throw new ApiError(403, 'forbidden', 'Your role cannot switch to visitor mode.');
        }
        switchedFromRole = user.role;
        nextRole = UserRole.VISITOR;
        await updateAuthUserCore({
          userId: user._id,
          role: UserRole.VISITOR,
          profile: { switchedFromRole }
        });
      }
    } else {
      if (user.role !== UserRole.VISITOR) {
        throw new ApiError(400, 'invalid_role_switch', 'You are already using your original role.');
      }
      if (!switchedFromRole || !SWITCHABLE_PRIVILEGED_ROLES.includes(switchedFromRole)) {
        throw new ApiError(400, 'invalid_role_switch', 'No original role is available to restore.');
      }
      nextRole = switchedFromRole;
      switchedFromRole = null;
      await updateAuthUserCore({
        userId: user._id,
        role: nextRole,
        profile: { switchedFromRole: null }
      });
    }

    const accessToken = signAccessToken({
      sub: user._id,
      email: user.email,
      role: toSharedRole(nextRole)
    });

    res.json({
      data: {
        role: nextRole.toLowerCase(),
        switchedFromRole: switchedFromRole ? switchedFromRole.toLowerCase() : null
      },
      tokens: { accessToken }
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/notifications', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const { items: notifications, total, unreadCount } = await listUserNotifications({
      userId: req.auth!.userId,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize
    });

    res.json({
      ...paginatedResponse(
        notifications.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          type: item.type.toLowerCase(),
          isRead: item.isRead,
          meta: item.meta,
          createdAt: item.createdAt
        })),
        total,
        pg
      ),
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

userRouter.patch('/me/notifications/:id/read', validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    await markNotificationAsRead({ id, userId: req.auth!.userId });
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

userRouter.patch('/me/notifications/read-all', async (req, res, next) => {
  try {
    const count = await markAllNotificationsAsRead(req.auth!.userId);
    res.json({ message: 'All notifications marked as read.', count });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/groups', async (req, res, next) => {
  try {
    const groups = await listGroupsForUser(req.auth!.userId);
    res.json({ data: groups.map((group) => ({ ...group, createdAt: group.createdAt, updatedAt: group.updatedAt })) });
  } catch (error) {
    next(error);
  }
});

userRouter.post('/me/groups', validate({ body: createGroupSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createGroupSchema>;
    const group = await createSocialGroup({
      creatorUserId: req.auth!.userId,
      type: body.type,
      name: body.name,
      slogan: body.slogan,
      bannerUrl: body.bannerUrl,
      photoUrl: body.photoUrl
    });
    res.status(201).json({ data: group });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/groups/:groupId', validate({ params: groupIdParamSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership) {
      throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
    }

    const group = await findGroupById(groupId);
    if (!group) {
      throw new ApiError(404, 'group_not_found', 'Group not found.');
    }

    const [members, invites] = await Promise.all([
      listGroupMembersDetailed(groupId),
      membership.role === 'admin' ? listGroupInvites(groupId) : Promise.resolve([])
    ]);

    res.json({
      data: {
        group,
        membership,
        members,
        invites
      }
    });
  } catch (error) {
    next(error);
  }
});

userRouter.post('/me/groups/:groupId/invites', validate({ params: groupIdParamSchema, body: groupInviteSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const body = req.body as z.infer<typeof groupInviteSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership || membership.role !== 'admin') {
      throw new ApiError(403, 'forbidden', 'Only group admins can send invites.');
    }

    const invite = await createGroupInvite({
      groupId,
      invitedByUserId: req.auth!.userId,
      email: body.email,
      role: body.role
    });

    const invitedUser = await findAuthUserByEmail(body.email.trim().toLowerCase());
    if (invitedUser) {
      await createNotificationRecord({
        userId: invitedUser._id,
        title: 'Buddy request',
        body: 'You were invited to join a group.',
        type: NotificationType.SYSTEM,
        meta: {
          kind: 'buddy_request',
          inviteToken: invite.token,
          groupId,
          path: '/groups'
        }
      }).catch(() => undefined);
    }

    const inviteLink = `${env.APP_BASE_URL}/signup?groupInvite=${encodeURIComponent(invite.token)}`;

    res.status(201).json({ data: invite, inviteLink });
  } catch (error) {
    next(error);
  }
});

userRouter.post('/me/group-invites/accept', validate({ body: acceptInviteSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof acceptInviteSchema>;
    const user = await findAuthUserById(req.auth!.userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }

    let accepted;
    try {
      accepted = await acceptGroupInviteByToken({
        token: body.token,
        userId: user._id,
        email: user.email
      });
    } catch (error) {
      throw new ApiError(400, 'invite_email_mismatch', error instanceof Error ? error.message : 'Invalid invite.');
    }

    if (!accepted) {
      throw new ApiError(404, 'invite_not_found', 'Invite not found.');
    }
    if (accepted.status !== 'accepted') {
      throw new ApiError(400, 'invite_not_active', 'Invite is no longer active.');
    }

    const group = await findGroupById(accepted.groupId);
    if (group) {
      await createNotificationRecord({
        userId: group.adminUserId,
        title: 'Invite accepted',
        body: `${user.profile.displayName ?? user.email} joined ${group.name}.`,
        type: NotificationType.SYSTEM,
        meta: {
          kind: 'buddy_request',
          groupId: accepted.groupId,
          path: '/groups'
        }
      }).catch(() => undefined);
    }

    res.json({ message: 'Invite accepted.', data: accepted });
  } catch (error) {
    next(error);
  }
});

userRouter.patch('/me/groups/:groupId/members/:membershipId', validate({ params: groupMembershipIdParamSchema, body: groupMembershipPatchSchema }), async (req, res, next) => {
  try {
    const { groupId, membershipId } = req.params as z.infer<typeof groupMembershipIdParamSchema>;
    const body = req.body as z.infer<typeof groupMembershipPatchSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership || membership.role !== 'admin') {
      throw new ApiError(403, 'forbidden', 'Only group admins can change member access.');
    }

    const updated = await setGroupMembershipActiveState(membershipId, body.isActive);
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

userRouter.delete('/me/groups/:groupId/members/:membershipId', validate({ params: groupMembershipIdParamSchema }), async (req, res, next) => {
  try {
    const { groupId, membershipId } = req.params as z.infer<typeof groupMembershipIdParamSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership || membership.role !== 'admin') {
      throw new ApiError(403, 'forbidden', 'Only group admins can remove members.');
    }

    const result = await removeGroupMembership(membershipId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

userRouter.post('/me/groups/:groupId/kids', validate({ params: groupIdParamSchema, body: createKidSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const body = req.body as z.infer<typeof createKidSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership || membership.role !== 'admin') {
      throw new ApiError(403, 'forbidden', 'Only group admins can add kids.');
    }

    const kid = await createKidGroupMember({
      groupId,
      createdByUserId: req.auth!.userId,
      displayName: body.displayName,
      role: body.role
    });

    res.status(201).json({ data: kid });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/groups/:groupId/wall', validate({ params: groupIdParamSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership) {
      throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
    }
    const items = await listGroupWallMessages(groupId, 120);
    res.json({ data: items });
  } catch (error) {
    next(error);
  }
});

userRouter.post('/me/groups/:groupId/wall', validate({ params: groupIdParamSchema, body: createWallPostSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const body = req.body as z.infer<typeof createWallPostSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership) {
      throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
    }

    const message = await createGroupWallMessage({
      groupId,
      authorUserId: req.auth!.userId,
      body: body.body
    });

    res.status(201).json({ data: message });
  } catch (error) {
    next(error);
  }
});

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

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

// ─── User Search (for starting new conversations) ──────────────────────────

const userSearchSchema = z.object({
  q: z.string().min(1).max(100)
});

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

const userBriefParamSchema = z.object({ userId: z.string().min(1) });

userRouter.get('/users/:userId/brief', validate({ params: userBriefParamSchema }), async (req, res, next) => {
  try {
    const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
    const user = await findAuthUserById(userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }
    res.json({
      data: {
        id: user._id,
        displayName: user.profile.displayName ?? user.email.split('@')[0],
        avatarUrl: user.profile.avatarUrl ?? null
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── Organizer Application (user-facing) ───────────────────────────────────

const applicationSchema = z.object({
  requestedName: z.string().min(2).max(120),
  requestedType: z.enum(['GUIDE_OWNED', 'COMPANY']),
  hostDisplayName: z.string().min(2).max(80),
  bio: z.string().min(20).max(400),
  phone: z.string().min(5).max(30),
  nationality: z.string().min(2).max(80),
  residence: z.string().min(2).max(80),
  experience: z.string().max(50).optional(),
  languages: z.string().max(300).optional(),
  certificates: z.string().max(1000).optional(),
  notableHikes: z.string().max(1000).optional(),
  profilePhoto: z.string().url().optional().or(z.literal('')),
});

const organizerDetailsSchema = z.object({
  experience: z.string().max(50).optional(),
  languages: z.string().max(300).optional(),
  certificates: z.string().max(1000).optional(),
  notableHikes: z.string().max(1000).optional(),
  nationality: z.string().max(80).optional(),
  residence: z.string().max(80).optional(),
});

userRouter.patch(
  '/me/organizer-details',
  requireAuth,
  requireVerifiedEmail,
  validate({ body: organizerDetailsSchema }),
  async (req, res, next) => {
    try {
      const userId = req.auth!.userId;
      const body = req.body as z.infer<typeof organizerDetailsSchema>;
      let application = await findLatestOrganizerApplicationByApplicant(userId);

      if (application) {
        const current = (application.metadata as Record<string, unknown> | null) ?? {};
        application = await updateOrganizerApplicationMetadata(application.id, { ...current, ...body });
      } else {
        const tenant = await findTenantByOwnerId(userId);
        if (!tenant) {
          throw new ApiError(403, 'not_organizer', 'Only organizers can update public profile details.');
        }
        application = await createOrganizerApplicationDetailed({
          applicantId: userId,
          requestedName: tenant.name,
          requestedSlug: tenant.slug,
          requestedType: tenant.type,
          requestedTenantId: tenant.id,
          status: OrganizerApplicationStatus.APPROVED,
          metadata: body
        });
      }

      res.json({ data: parseOrganizerDetails(application.metadata) });
    } catch (error) {
      next(error);
    }
  }
);

userRouter.get('/me/organizer-application', requireAuth, async (req, res, next) => {
  try {
    const application = await findLatestOrganizerApplicationWithApplicant(req.auth!.userId);

    if (!application) {
      return res.json({ data: null });
    }

    res.json({
      data: {
        id: application.id,
        applicantEmail: application.applicant.email,
        applicantName: application.applicant.profile?.displayName ?? application.applicant.email,
        requestedName: application.requestedName,
        requestedType: application.requestedType,
        status: application.status,
        metadata: application.metadata,
        createdAt: application.createdAt.toISOString(),
      }
    });
  } catch (error) {
    next(error);
  }
});

userRouter.post(
  '/me/organizer-application',
  requireAuth,
  validate({ body: applicationSchema }),
  async (req, res, next) => {
    try {
      const userId = req.auth!.userId;

      // Check for existing pending application
      const existing = await findPendingOrganizerApplicationByApplicant(userId);
      if (existing) {
        throw new ApiError(409, 'application_exists', 'You already have a pending organizer application.');
      }

      const body = req.body as z.infer<typeof applicationSchema>;

      await updateAuthUserProfile(userId, {
        displayName: body.hostDisplayName,
        bio: body.bio,
        phone: body.phone,
        ...(body.profilePhoto ? { avatarUrl: body.profilePhoto } : {})
      });

      const application = await createOrganizerApplicationDetailed({
        applicantId: userId,
        requestedName: body.requestedName,
        requestedSlug: slugify(body.requestedName),
        requestedType: body.requestedType,
        metadata: {
          hostDisplayName: body.hostDisplayName,
          bio: body.bio,
          phone: body.phone,
          nationality: body.nationality,
          residence: body.residence,
          experience: body.experience ?? '',
          languages: body.languages ?? '',
          certificates: body.certificates ?? '',
          notableHikes: body.notableHikes ?? '',
          profilePhoto: body.profilePhoto ?? '',
        },
      });

      res.status(201).json({
        data: {
          id: application.id,
          applicantEmail: req.auth!.email,
          applicantName: body.requestedName,
          requestedName: application.requestedName,
          requestedType: application.requestedType,
          status: application.status,
          metadata: application.metadata,
          createdAt: application.createdAt.toISOString(),
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── User location submission (any signed-in user) ─────────────────────────

userRouter.get('/me/locations', async (req, res, next) => {
  try {
    const locations = await listSubmittedLocationsByUser(req.auth!.userId);
    res.json({ data: locations.map((l) => toLocationDto(l)) });
  } catch (error) {
    next(error);
  }
});

userRouter.post('/me/locations', validate({ body: locationSubmitBodySchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof locationSubmitBodySchema>;

    const created = await createLocationRecord(buildLocationCreateData(body, req.auth!.userId));

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.submit',
      entityType: 'location',
      entityId: created.id
    });

    void awardPointsDefault({
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

// ─── Trail Points / Rewards ─────────────────────────────────────────────────

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
    const data = await getRewardStatsDefault();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/rewards/leaderboard', async (_req, res, next) => {
  try {
    const data = await getLeaderboardDefault(10);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/rewards', requireAuth, async (req, res, next) => {
  try {
    const data = await getRewardSummaryDefault(req.auth!.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
