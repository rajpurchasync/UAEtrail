import { EventStatus, LocationStatus, RequestStatus, TenantStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { assertCapacityAvailable } from '../domain/capacity.js';
import { ApiError } from '../lib/api-error.js';
import { toEventDto, toLocationDto } from '../lib/mappers.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

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
  featured: z.coerce.boolean().optional()
});

export const userRouter = Router();

userRouter.get('/locations', validate({ query: listFilterSchema }), async (req, res, next) => {
  try {
    const filters = req.query as z.infer<typeof listFilterSchema>;
    const locations = await prisma.location.findMany({
      where: {
        status: LocationStatus.ACTIVE,
        activityType: filters.activityType ? (filters.activityType === 'hiking' ? 'HIKING' : 'CAMPING') : undefined,
        featured: filters.featured
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
    });
    res.json({ data: locations.map(toLocationDto) });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/events', async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        location: { status: LocationStatus.ACTIVE }
      },
      orderBy: { startAt: 'asc' },
      include: {
        location: true,
        tenant: true,
        guide: { include: { profile: true } },
        participants: { select: { id: true } }
      }
    });

    res.json({
      data: events.map((event) =>
        toEventDto({
          event,
          locationName: event.location.name,
          activityType: event.location.activityType,
          slotsAvailable: Math.max(event.capacity - event.participants.length, 0),
          organizerName: event.guide?.profile?.displayName ?? event.tenant.name,
          organizerAvatar: event.guide?.profile?.avatarUrl
        })
      )
    });
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
        ...toEventDto({
          event,
          locationName: event.location.name,
          activityType: event.location.activityType,
          slotsAvailable: Math.max(event.capacity - event.participants.length, 0),
          organizerName: event.guide?.profile?.displayName ?? event.tenant.name,
          organizerAvatar: event.guide?.profile?.avatarUrl
        }),
        description: event.description,
        participants: event.participants.map((participant) => ({
          id: participant.userId,
          name: participant.user.profile?.displayName ?? participant.user.email,
          avatar: participant.user.profile?.avatarUrl
        })),
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

      const event = await prisma.event.findFirst({
        where: {
          id,
          status: EventStatus.PUBLISHED
        },
        include: {
          participants: { select: { id: true } }
        }
      });
      if (!event) {
        throw new ApiError(404, 'event_not_found', 'Event not found.');
      }
      assertCapacityAvailable(event.capacity, event.participants.length);

      const existing = await prisma.eventRequest.findUnique({
        where: {
          eventId_userId: {
            eventId: id,
            userId: req.auth!.userId
          }
        }
      });

      if (
        existing &&
        (existing.status === RequestStatus.PENDING || existing.status === RequestStatus.APPROVED)
      ) {
        throw new ApiError(409, 'request_exists', 'You already have an active request for this event.');
      }

      const request = existing
        ? await prisma.eventRequest.update({
            where: { id: existing.id },
            data: {
              status: RequestStatus.PENDING,
              note: note ?? existing.note,
              organizerNote: null,
              reviewedAt: null,
              reviewedById: null
            }
          })
        : await prisma.eventRequest.create({
            data: {
              eventId: id,
              userId: req.auth!.userId,
              note
            }
          });

      res.status(201).json({
        data: {
          id: request.id,
          eventId: request.eventId,
          userId: request.userId,
          status: request.status.toLowerCase(),
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
      if (!(request.status === RequestStatus.PENDING || request.status === RequestStatus.APPROVED)) {
        throw new ApiError(400, 'request_not_cancellable', 'This request cannot be cancelled.');
      }

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
    const requests = await prisma.eventRequest.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: {
            location: true
          }
        }
      }
    });

    res.json({
      data: requests.map((request) => ({
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
          time: request.event.startAt.toISOString().slice(11, 16)
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/me/trips', async (req, res, next) => {
  try {
    const participantEntries = await prisma.eventParticipant.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
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
    });

    res.json({
      data: participantEntries.map((entry) =>
        toEventDto({
          event: entry.event,
          locationName: entry.event.location.name,
          activityType: entry.event.location.activityType,
          slotsAvailable: Math.max(entry.event.capacity - entry.event.participants.length, 0),
          organizerName: entry.event.guide?.profile?.displayName ?? entry.event.tenant.name,
          organizerAvatar: entry.event.guide?.profile?.avatarUrl
        })
      )
    });
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
    const notifications = await prisma.notification.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      data: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type.toLowerCase(),
        isRead: item.isRead,
        createdAt: item.createdAt
      }))
    });
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
