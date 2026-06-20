import { EventStatus, LocationStatus, OrganizerApplicationStatus, RequestStatus, TenantStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { toEventDto, toLocationDto, buildEventDto, toParticipantPreviews } from '../lib/mappers.js';
import { paginate, paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { viewLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { slugify } from '../lib/slug.js';
import { createJoinOrWaitlistRequest, promoteNextWaitlisted } from '../services/join-request.js';
import { getVapidPublicKey } from '../lib/push.js';

const eventIdParamSchema = z.object({ id: z.string().min(1) });
const requestIdParamSchema = z.object({ id: z.string().min(1), requestId: z.string().min(1) });

const createRequestSchema = z.object({
  note: z.string().max(300).optional()
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
    const where: Record<string, unknown> = {
      status: LocationStatus.ACTIVE,
      ...(filters.activityType
        ? { activityType: filters.activityType === 'hiking' ? 'HIKING' : 'CAMPING' }
        : {}),
      ...(filters.featured !== undefined ? { featured: filters.featured } : {}),
      ...(filters.countryCode ? { countryCode: filters.countryCode.toUpperCase() } : {})
    };

    let locations = await prisma.location.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
    });

    if (filters.lat != null && filters.lng != null) {
      const radiusKm = filters.radius ?? 50;
      locations = locations.filter((loc) => {
        if (loc.latitude == null || loc.longitude == null) return false;
        const dLat = ((loc.latitude - filters.lat!) * Math.PI) / 180;
        const dLng = ((loc.longitude - filters.lng!) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((filters.lat! * Math.PI) / 180) *
            Math.cos((loc.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return distKm <= radiusKm;
      });
    }

    const total = locations.length;
    const start = (pg.page - 1) * pg.pageSize;
    const paged = locations.slice(start, start + pg.pageSize);
    res.json(paginatedResponse(paged.map(toLocationDto), total, pg));
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
    res.json({ data: locations.map(toLocationDto) });
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
        participants: {
          include: { user: { include: { profile: true } } }
        }
      }
    });
    res.json({ data: events.map((event) => buildEventDto(event)) });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/locations/:id', validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const location = await prisma.location.findFirst({
      where: { id, status: LocationStatus.ACTIVE }
    });
    if (!location) {
      throw new ApiError(404, 'location_not_found', 'Location not found.');
    }
    res.json({ data: toLocationDto(location) });
  } catch (error) {
    next(error);
  }
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
      include: {
        location: true,
        tenant: true,
        guide: { include: { profile: true } },
        participants: { select: { id: true } }
      }
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
        include: {
          location: true,
          tenant: true,
          guide: { include: { profile: true } },
          participants: { select: { id: true } }
        }
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

userRouter.get('/events/:id', validate({ params: eventIdParamSchema }), async (req, res, next) => {
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

    res.json({
      data: {
        ...buildEventDto(event),
        organizerId: event.tenant.ownerId,
        participants: toParticipantPreviews(event.participants),
        location: toLocationDto(event.location)
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
      const { note } = req.body as z.infer<typeof createRequestSchema>;

      const { request, waitlisted } = await createJoinOrWaitlistRequest(prisma, {
        eventId: id,
        userId: req.auth!.userId,
        note
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

userRouter.patch(
  '/events/:id/requests/:requestId/cancel',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: requestIdParamSchema }),
  async (req, res, next) => {
    try {
      const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
      const request = await prisma.eventRequest.findFirst({
        where: {
          id: requestId,
          userId: req.auth!.userId
        }
      });
      if (!request) {
        throw new ApiError(404, 'request_not_found', 'Request not found.');
      }
      if (
        !(
          request.status === RequestStatus.PENDING ||
          request.status === RequestStatus.APPROVED ||
          request.status === RequestStatus.WAITLISTED
        )
      ) {
        throw new ApiError(400, 'request_not_cancellable', 'This request cannot be cancelled.');
      }

      const eventId = request.eventId;
      await prisma.$transaction(async (tx) => {
        await tx.eventRequest.update({
          where: { id: request.id },
          data: {
            status: RequestStatus.CANCELLED
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

userRouter.use(requireAuth, requireVerifiedEmail);

userRouter.get('/me/requests', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const where = { userId: req.auth!.userId };
    const [requests, total] = await Promise.all([
      prisma.eventRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(pg),
        include: {
          event: {
            include: {
              location: true,
              tenant: true,
              guide: { include: { profile: true } }
            }
          }
        }
      }),
      prisma.eventRequest.count({ where })
    ]);

    res.json(paginatedResponse(
      requests.map((request) => ({
        id: request.id,
        status: request.status.toLowerCase(),
        note: request.note,
        organizerNote: request.organizerNote,
        createdAt: request.createdAt,
        event: {
          id: request.event.id,
          title: request.event.title,
          locationName: request.event.location.name,
          date: request.event.startAt.toISOString().slice(0, 10),
          time: request.event.startAt.toISOString().slice(11, 16),
          organizerName: request.event.guide?.profile?.displayName ?? request.event.tenant.name
        }
      })),
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
            include: {
              location: true,
              tenant: true,
              guide: { include: { profile: true } },
              participants: { select: { id: true } }
            }
          }
        }
      }),
      prisma.eventParticipant.count({ where })
    ]);

    res.json(paginatedResponse(
      participantEntries.map((entry) => buildEventDto(entry.event)),
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
        email: u.email,
        displayName: u.profile?.displayName ?? null,
        avatarUrl: u.profile?.avatarUrl ?? null
      }))
    });
  } catch (error) {
    next(error);
  }
});

// ─── Organizer Application (user-facing) ───────────────────────────────────

const applicationSchema = z.object({
  requestedName: z.string().min(2).max(120),
  requestedType: z.enum(['GUIDE_OWNED', 'COMPANY']),
  phone: z.string().min(5).max(30),
  nationality: z.string().min(2).max(80),
  residence: z.string().min(2).max(80),
  experience: z.string().max(50).optional(),
  languages: z.string().max(300).optional(),
  certificates: z.string().max(1000).optional(),
  notableHikes: z.string().max(1000).optional(),
  profilePhoto: z.string().url().optional().or(z.literal('')),
});

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

      const application = await prisma.organizerApplication.create({
        data: {
          applicantId: userId,
          requestedName: body.requestedName,
          requestedSlug: slugify(body.requestedName),
          requestedType: body.requestedType,
          metadata: {
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
