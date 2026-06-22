import { ActivityType, EventStatus, LocationStatus, LocationUnlockSource, OrganizerApplicationStatus, RequestStatus, TenantStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { toLocationDto, buildEventDto, toParticipantPreviews } from '../lib/mappers.js';
import { paginate, paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { viewLimiter } from '../middleware/rate-limit-instances.js';
import { validate } from '../middleware/validate.js';
import { slugify } from '../lib/slug.js';
import { createJoinOrWaitlistRequest, promoteNextWaitlisted } from '../services/join-request.js';
import { buildParticipationDto, performParticipantCheckIn } from '../services/checkin.js';
import { canWithdrawRequest, withdrawReasonSchema } from '../lib/withdraw-reasons.js';
import { getVapidPublicKey } from '../lib/push.js';
import { EARN_OPPORTUNITIES, MEMBERSHIP_TIERS, REWARD_POINTS } from '../lib/rewards-config.js';
import { getLeaderboard, getRewardStats, getRewardSummary } from '../services/rewards.js';
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

const eventIdParamSchema = z.object({ id: z.string().min(1) });
const requestIdParamSchema = z.object({ id: z.string().min(1), requestId: z.string().min(1) });

const eventWithParticipantPreviews = {
  location: true,
  tenant: true,
  guide: { include: { profile: true } },
  participants: {
    include: {
      user: { include: { profile: true } }
    }
  }
} as const;

const createRequestSchema = z.object({
  note: z.string().max(300).optional(),
  selectedPackageIndex: z.number().int().min(0).max(11).optional()
});

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  phone: z.string().max(30).optional(),
  bio: z.string().max(400).optional(),
  avatarUrl: z.string().url().optional()
});

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

// ─── Popular Locations (by viewCount desc, fallback to latest) ──────────────

userRouter.get('/locations/popular', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const locations = await prisma.location.findMany({
      where: { status: LocationStatus.ACTIVE },
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
      take: limit
    });
    res.json({ data: locations.map((l) => toLocationDto(l)) });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/:id/events', validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const events = await prisma.event.findMany({
      where: {
        locationId: id,
        status: EventStatus.PUBLISHED,
        startAt: { gte: new Date() },
        location: { status: LocationStatus.ACTIVE }
      },
      orderBy: { startAt: 'asc' },
      take: 20,
      include: {
        location: true,
        tenant: true,
        guide: { include: { profile: true } },
        participants: eventWithParticipantPreviews.participants
      }
    });
    res.json({ data: events.map((event) => buildEventDto(event)) });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/:id', optionalAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const location = await prisma.location.findFirst({
      where: { id, status: LocationStatus.ACTIVE }
    });
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
    const location = await prisma.location.findFirst({
      where: { id, status: LocationStatus.ACTIVE }
    });
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
    const location = await prisma.location.findFirst({
      where: { id, status: LocationStatus.ACTIVE }
    });
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
    const location = await prisma.location.findFirst({
      where: { id, status: LocationStatus.ACTIVE }
    });
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
    const location = await prisma.location.findFirst({
      where: { id, status: LocationStatus.ACTIVE }
    });
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
    await prisma.location.updateMany({
      where: { id, status: LocationStatus.ACTIVE },
      data: { viewCount: { increment: 1 } }
    });
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
  const application = await prisma.organizerApplication.findFirst({
    where: { applicantId: userId },
    orderBy: { createdAt: 'desc' }
  });
  return parseOrganizerDetails(application?.metadata);
};

// ─── Public Tenant/Operator Profile ─────────────────────────────────────────

userRouter.get('/tenants/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug, status: TenantStatus.ACTIVE },
      include: {
        owner: { include: { profile: true } },
        memberships: {
          include: { user: { include: { profile: true } } }
        },
        events: {
          where: {
            status: EventStatus.PUBLISHED,
            startAt: { gte: new Date() },
            location: { status: LocationStatus.ACTIVE }
          },
          orderBy: { startAt: 'asc' },
          take: 20,
          include: {
            location: true,
            tenant: true,
            guide: { include: { profile: true } },
            participants: {
              include: { user: { include: { profile: true } } }
            }
          }
        }
      }
    });
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
    const events = await prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        featured: true,
        startAt: { gte: new Date() },
        location: { status: LocationStatus.ACTIVE }
      },
      orderBy: { startAt: 'asc' },
      take: limit,
      include: eventWithParticipantPreviews
    });
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
    const where = {
      status: EventStatus.PUBLISHED,
      location: { status: LocationStatus.ACTIVE }
    };
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startAt: 'asc' },
        ...paginate(pg),
        include: eventWithParticipantPreviews
      }),
      prisma.event.count({ where })
    ]);

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
    const event = await prisma.event.findFirst({
      where: {
        id,
        status: EventStatus.PUBLISHED,
        location: { status: LocationStatus.ACTIVE }
      },
      include: {
        location: true,
        tenant: true,
        guide: { include: { profile: true } },
        participants: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      }
    });

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
      const requestRow = await prisma.eventRequest.findUnique({
        where: { eventId_userId: { eventId: id, userId: req.auth.userId } }
      });
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

      const { request, waitlisted } = await createJoinOrWaitlistRequest(prisma, {
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
      const request = await prisma.eventRequest.findFirst({
        where: {
          id: requestId,
          userId: req.auth!.userId
        }
      });
      if (!request) {
        throw new ApiError(404, 'request_not_found', 'Request not found.');
      }
      if (!canWithdrawRequest(request.status.toLowerCase())) {
        throw new ApiError(400, 'request_not_cancellable', 'This request cannot be cancelled.');
      }

      const eventId = request.eventId;
      await prisma.$transaction(async (tx) => {
        await tx.eventRequest.update({
          where: { id: request.id },
          data: {
            status: RequestStatus.CANCELLED,
            cancelReason: reason,
            cancelMessage: message?.trim() || null,
            cancelledAt: new Date()
          }
        });
        await tx.eventParticipant.deleteMany({
          where: { requestId: request.id }
        });
        await promoteNextWaitlisted(tx, eventId);
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
      const request = await prisma.eventRequest.findFirst({
        where: {
          id: requestId,
          userId: req.auth!.userId
        }
      });
      if (!request) {
        throw new ApiError(404, 'request_not_found', 'Request not found.');
      }
      if (request.status !== RequestStatus.PENDING) {
        throw new ApiError(400, 'request_not_editable', 'Only pending requests can be updated.');
      }
      const updated = await prisma.eventRequest.update({
        where: { id: request.id },
        data: { note }
      });
      res.json({ data: { id: updated.id, note: updated.note } });
    } catch (error) {
      next(error);
    }
  }
);

userRouter.use(requireAuth, requireVerifiedEmail);

userRouter.post('/events/:id/checkin', validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const participant = await prisma.eventParticipant.findFirst({
      where: { eventId: id, userId: req.auth!.userId },
      include: { event: true }
    });
    if (!participant) {
      throw new ApiError(404, 'not_a_participant', 'You are not confirmed for this trip.');
    }

    const result = await performParticipantCheckIn(prisma, {
      eventId: id,
      participantId: participant.id,
      actorUserId: req.auth!.userId,
      source: 'self'
    });

    res.json({
      message: result.alreadyCheckedIn ? 'You are already checked in.' : 'Checked in successfully.',
      checkedInAt: result.checkedInAt.toISOString(),
      participation: buildParticipationDto(participant.event, {
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

const meRequestInclude = {
  event: {
    include: {
      location: true,
      tenant: { include: { owner: true } },
      guide: { include: { profile: true } }
    }
  }
} as const;

userRouter.get('/me/requests/:requestId', validate({ params: meRequestIdParamSchema }), async (req, res, next) => {
  try {
    const { requestId } = req.params as z.infer<typeof meRequestIdParamSchema>;
    const request = await prisma.eventRequest.findFirst({
      where: { id: requestId, userId: req.auth!.userId },
      include: meRequestInclude
    });
    if (!request) {
      throw new ApiError(404, 'request_not_found', 'Request not found.');
    }
    res.json({ data: mapMeRequest(request) });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/requests', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const where = { userId: req.auth!.userId };
    const [requests, total] = await Promise.all([
      prisma.eventRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(pg),
        include: meRequestInclude
      }),
      prisma.eventRequest.count({ where })
    ]);

    res.json(paginatedResponse(
      requests.map(mapMeRequest),
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
    const where = { userId: req.auth!.userId };
    const [participantEntries, total] = await Promise.all([
      prisma.eventParticipant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(pg),
        include: {
          event: {
            include: eventWithParticipantPreviews
          }
        }
      }),
      prisma.eventParticipant.count({ where })
    ]);

    res.json(paginatedResponse(
      participantEntries.map((entry) => ({
        ...buildEventDto(entry.event),
        participation: buildParticipationDto(entry.event, entry)
      })),
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/profile', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { profile: true }
    });
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }
    res.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
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
    const profile = await prisma.profile.upsert({
      where: { userId: req.auth!.userId },
      update: data,
      create: {
        userId: req.auth!.userId,
        ...data
      }
    });
    res.json({
      data: {
        displayName: profile.displayName,
        phone: profile.phone,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/notifications', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const where = { userId: req.auth!.userId };
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(pg)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } })
    ]);

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
    await prisma.notification.updateMany({
      where: { id, userId: req.auth!.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

userRouter.patch('/me/notifications/read-all', async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.auth!.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read.', count: result.count });
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
    const sub = await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: req.auth!.userId,
          endpoint: body.endpoint
        }
      },
      create: {
        userId: req.auth!.userId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth
      },
      update: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth
      }
    });
    res.status(201).json({ data: { id: sub.id } });
  } catch (error) {
    next(error);
  }
});

userRouter.delete('/me/push-subscriptions', validate({ body: z.object({ endpoint: z.string().url() }) }), async (req, res, next) => {
  try {
    const { endpoint } = req.body as { endpoint: string };
    await prisma.pushSubscription.deleteMany({
      where: { userId: req.auth!.userId, endpoint }
    });
    res.json({ message: 'Push subscription removed.' });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/tenants', async (req, res, next) => {
  try {
    const memberships = await prisma.tenantMembership.findMany({
      where: {
        userId: req.auth!.userId,
        tenant: {
          status: TenantStatus.ACTIVE
        }
      },
      include: {
        tenant: true
      },
      orderBy: { createdAt: 'asc' }
    });

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

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        status: 'ACTIVE',
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { profile: { displayName: { contains: q, mode: 'insensitive' } } }
        ]
      },
      include: { profile: true },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      data: users.map((u) => ({
        id: u.id,
        displayName: u.profile?.displayName ?? null,
        avatarUrl: u.profile?.avatarUrl ?? null
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
    const user = await prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE' },
      include: { profile: true }
    });
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }
    res.json({
      data: {
        id: user.id,
        displayName: user.profile?.displayName ?? user.email.split('@')[0],
        avatarUrl: user.profile?.avatarUrl ?? null
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
      let application = await prisma.organizerApplication.findFirst({
        where: { applicantId: userId },
        orderBy: { createdAt: 'desc' }
      });

      if (application) {
        const current = (application.metadata as Record<string, unknown> | null) ?? {};
        application = await prisma.organizerApplication.update({
          where: { id: application.id },
          data: { metadata: { ...current, ...body } }
        });
      } else {
        const tenant = await prisma.tenant.findFirst({ where: { ownerId: userId } });
        if (!tenant) {
          throw new ApiError(403, 'not_organizer', 'Only organizers can update public profile details.');
        }
        application = await prisma.organizerApplication.create({
          data: {
            applicantId: userId,
            requestedName: tenant.name,
            requestedSlug: tenant.slug,
            requestedType: tenant.type,
            requestedTenantId: tenant.id,
            status: OrganizerApplicationStatus.APPROVED,
            metadata: body
          }
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
    const application = await prisma.organizerApplication.findFirst({
      where: { applicantId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
      include: { applicant: { include: { profile: true } } }
    });

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
      const existing = await prisma.organizerApplication.findFirst({
        where: { applicantId: userId, status: OrganizerApplicationStatus.PENDING }
      });
      if (existing) {
        throw new ApiError(409, 'application_exists', 'You already have a pending organizer application.');
      }

      const body = req.body as z.infer<typeof applicationSchema>;

      await prisma.profile.upsert({
        where: { userId },
        update: {
          displayName: body.hostDisplayName,
          bio: body.bio,
          phone: body.phone,
          ...(body.profilePhoto ? { avatarUrl: body.profilePhoto } : {})
        },
        create: {
          userId,
          displayName: body.hostDisplayName,
          bio: body.bio,
          phone: body.phone,
          avatarUrl: body.profilePhoto || undefined
        }
      });

      const application = await prisma.organizerApplication.create({
        data: {
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
    const data = await getRewardStats(prisma);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/rewards/leaderboard', async (_req, res, next) => {
  try {
    const data = await getLeaderboard(prisma, 10);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/rewards', requireAuth, async (req, res, next) => {
  try {
    const data = await getRewardSummary(prisma, req.auth!.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
