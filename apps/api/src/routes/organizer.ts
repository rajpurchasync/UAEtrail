import { EventStatus, LocationStatus, MembershipRole, NotificationType, RequestStatus, TenantType, UserRole } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { assertCapacityAvailable } from '../domain/capacity.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { randomToken } from '../lib/hash.js';
import { toEventDto } from '../lib/mappers.js';
import { hashPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireMembershipRole, requireTenantContext } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';

const idParamSchema = z.object({ id: z.string().min(1) });
const membershipIdSchema = z.object({ membershipId: z.string().min(1) });

const eventCreateSchema = z.object({
  locationId: z.string().min(1),
  title: z.string().min(4).max(120),
  description: z.string().min(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  meetingPoint: z.string().max(200).optional(),
  itinerary: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  price: z.number().int().min(0).default(0),
  capacity: z.number().int().positive(),
  guideId: z.string().optional()
});

const eventPatchSchema = eventCreateSchema.partial();
const requestDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  organizerNote: z.string().max(300).optional()
});

const teamCreateSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80).optional(),
  role: z.enum(['tenant_admin', 'tenant_guide'])
});

const teamPatchSchema = z.object({
  role: z.enum(['tenant_admin', 'tenant_guide'])
});

const parseDateTime = (date: string, time: string): Date => new Date(`${date}T${time}:00.000Z`);

const membershipRoleToPrisma = (role: 'tenant_admin' | 'tenant_guide'): MembershipRole =>
  role === 'tenant_admin' ? MembershipRole.TENANT_ADMIN : MembershipRole.TENANT_GUIDE;

export const organizerRouter = Router();

organizerRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

organizerRouter.get('/events', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const events = await prisma.event.findMany({
      where: { tenantId },
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

organizerRouter.post('/events', validate({ body: eventCreateSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const body = req.body as z.infer<typeof eventCreateSchema>;

    const location = await prisma.location.findUnique({ where: { id: body.locationId } });
    if (!location || location.status !== LocationStatus.ACTIVE) {
      throw new ApiError(400, 'invalid_location', 'Location must exist and be active.');
    }

    if (body.guideId) {
      const guideMembership = await prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: body.guideId
          }
        }
      });
      if (!guideMembership) {
        throw new ApiError(400, 'invalid_guide', 'Guide must belong to this tenant.');
      }
    }

    const created = await prisma.event.create({
      data: {
        tenantId,
        locationId: body.locationId,
        createdById: req.auth!.userId,
        guideId: body.guideId ?? req.auth!.userId,
        title: body.title,
        description: body.description,
        startAt: parseDateTime(body.date, body.time),
        endAt: body.endDate && body.endTime ? parseDateTime(body.endDate, body.endTime) : undefined,
        meetingPoint: body.meetingPoint,
        itinerary: body.itinerary,
        requirements: body.requirements,
        priceAed: body.price,
        capacity: body.capacity
      },
      include: {
        location: true,
        tenant: true,
        guide: { include: { profile: true } },
        participants: { select: { id: true } }
      }
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'event.create',
      entityType: 'event',
      entityId: created.id,
      tenantId
    });

    res.status(201).json({
      data: toEventDto({
        event: created,
        locationName: created.location.name,
        activityType: created.location.activityType,
        slotsAvailable: Math.max(created.capacity - created.participants.length, 0),
        organizerName: created.guide?.profile?.displayName ?? created.tenant.name,
        organizerAvatar: created.guide?.profile?.avatarUrl
      })
    });
  } catch (error) {
    next(error);
  }
});

organizerRouter.patch('/events/:id', validate({ params: idParamSchema, body: eventPatchSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof eventPatchSchema>;

    const existing = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        locationId: body.locationId,
        title: body.title,
        description: body.description,
        startAt: body.date && body.time ? parseDateTime(body.date, body.time) : undefined,
        endAt: body.endDate && body.endTime ? parseDateTime(body.endDate, body.endTime) : undefined,
        meetingPoint: body.meetingPoint,
        itinerary: body.itinerary,
        requirements: body.requirements,
        priceAed: body.price,
        capacity: body.capacity,
        guideId: body.guideId
      },
      include: {
        location: true,
        tenant: true,
        guide: { include: { profile: true } },
        participants: { select: { id: true } }
      }
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'event.update',
      entityType: 'event',
      entityId: id,
      tenantId
    });

    res.json({
      data: toEventDto({
        event: updated,
        locationName: updated.location.name,
        activityType: updated.location.activityType,
        slotsAvailable: Math.max(updated.capacity - updated.participants.length, 0),
        organizerName: updated.guide?.profile?.displayName ?? updated.tenant.name,
        organizerAvatar: updated.guide?.profile?.avatarUrl
      })
    });
  } catch (error) {
    next(error);
  }
});

organizerRouter.delete('/events/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const event = await prisma.event.findFirst({
      where: {
        id,
        tenantId
      }
    });
    if (!event) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }
    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.CANCELLED }
    });
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'event.cancel',
      entityType: 'event',
      entityId: event.id,
      tenantId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

organizerRouter.post('/events/:id/publish', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const event = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!event) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }
    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: EventStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'event.publish',
      entityType: 'event',
      entityId: event.id,
      tenantId
    });
    res.json({ message: 'Event published.', eventId: updated.id });
  } catch (error) {
    next(error);
  }
});

organizerRouter.get('/requests', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const requests = await prisma.eventRequest.findMany({
      where: {
        event: { tenantId }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: {
            location: true
          }
        },
        user: { include: { profile: true } }
      }
    });
    res.json({
      data: requests.map((request) => ({
        id: request.id,
        status: request.status.toLowerCase(),
        note: request.note,
        organizerNote: request.organizerNote,
        createdAt: request.createdAt,
        user: {
          id: request.user.id,
          email: request.user.email,
          displayName: request.user.profile?.displayName ?? request.user.email
        },
        event: {
          id: request.event.id,
          title: request.event.title,
          locationName: request.event.location.name,
          startAt: request.event.startAt
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});

organizerRouter.patch('/requests/:id', validate({ params: idParamSchema, body: requestDecisionSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { status, organizerNote } = req.body as z.infer<typeof requestDecisionSchema>;

    const request = await prisma.eventRequest.findFirst({
      where: { id, event: { tenantId } },
      include: {
        event: { include: { participants: true } }
      }
    });

    if (!request) {
      throw new ApiError(404, 'request_not_found', 'Join request not found.');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new ApiError(400, 'request_finalized', 'Only pending requests can be processed.');
    }

    if (status === 'approved') {
      await prisma.$transaction(async (tx) => {
        const freshEvent = await tx.event.findUnique({
          where: { id: request.eventId },
          include: { participants: { select: { id: true } } }
        });
        if (!freshEvent || freshEvent.status !== EventStatus.PUBLISHED) {
          throw new ApiError(400, 'event_not_publishable', 'Event must be published before approval.');
        }
        assertCapacityAvailable(freshEvent.capacity, freshEvent.participants.length);

        await tx.eventRequest.update({
          where: { id: request.id },
          data: {
            status: RequestStatus.APPROVED,
            organizerNote,
            reviewedById: req.auth!.userId,
            reviewedAt: new Date()
          }
        });

        await tx.eventParticipant.create({
          data: {
            eventId: request.eventId,
            requestId: request.id,
            userId: request.userId,
            approvedById: req.auth!.userId
          }
        });

        await tx.notification.create({
          data: {
            userId: request.userId,
            title: 'Join request approved',
            body: 'Your request was approved. You are now confirmed for the event.',
            type: NotificationType.REQUEST_UPDATE,
            meta: { eventId: request.eventId, requestId: request.id }
          }
        });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.eventRequest.update({
          where: { id: request.id },
          data: {
            status: RequestStatus.REJECTED,
            organizerNote,
            reviewedById: req.auth!.userId,
            reviewedAt: new Date()
          }
        });
        await tx.notification.create({
          data: {
            userId: request.userId,
            title: 'Join request rejected',
            body: organizerNote ?? 'Your request could not be approved at this time.',
            type: NotificationType.REQUEST_UPDATE,
            meta: { eventId: request.eventId, requestId: request.id }
          }
        });
      });
    }

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `request.${status}`,
      entityType: 'event_request',
      entityId: request.id,
      tenantId
    });

    res.json({ message: `Request ${status}.` });
  } catch (error) {
    next(error);
  }
});

organizerRouter.get('/team', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const members = await prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      data: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        email: member.user.email,
        displayName: member.user.profile?.displayName ?? member.user.email,
        role: member.role.toLowerCase(),
        createdAt: member.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

organizerRouter.post(
  '/team',
  requireMembershipRole([MembershipRole.TENANT_OWNER, MembershipRole.TENANT_ADMIN]),
  validate({ body: teamCreateSchema }),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const body = req.body as z.infer<typeof teamCreateSchema>;
      const role = membershipRoleToPrisma(body.role);

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) {
        throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
      }

      let user = await prisma.user.findUnique({ where: { email: body.email }, include: { profile: true } });
      if (!user) {
        const tempPassword = `Temp#${randomToken(6)}`;
        user = await prisma.user.create({
          data: {
            email: body.email,
            passwordHash: await hashPassword(tempPassword),
            role: role === MembershipRole.TENANT_ADMIN ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE,
            profile: {
              create: {
                displayName: body.displayName ?? body.email.split('@')[0]
              }
            }
          },
          include: { profile: true }
        });
      }

      if (role === MembershipRole.TENANT_GUIDE && tenant.type === TenantType.COMPANY) {
        const existingCompanyGuideMembership = await prisma.tenantMembership.findFirst({
          where: {
            userId: user.id,
            role: MembershipRole.TENANT_GUIDE,
            tenant: {
              type: TenantType.COMPANY
            }
          }
        });
        if (existingCompanyGuideMembership && existingCompanyGuideMembership.tenantId !== tenantId) {
          throw new ApiError(400, 'guide_tenant_conflict', 'Guide is already assigned to another company tenant.');
        }
      }

      const membership = await prisma.tenantMembership.upsert({
        where: {
          tenantId_userId: {
            tenantId,
            userId: user.id
          }
        },
        update: {
          role
        },
        create: {
          tenantId,
          userId: user.id,
          role
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: role === MembershipRole.TENANT_ADMIN ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE
        }
      });

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'team.upsert_member',
        entityType: 'tenant_membership',
        entityId: membership.id,
        tenantId
      });

      res.status(201).json({
        data: {
          id: membership.id,
          userId: user.id,
          email: user.email,
          displayName: user.profile?.displayName ?? user.email,
          role: membership.role.toLowerCase()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

organizerRouter.patch(
  '/team/:membershipId',
  requireMembershipRole([MembershipRole.TENANT_OWNER, MembershipRole.TENANT_ADMIN]),
  validate({ params: membershipIdSchema, body: teamPatchSchema }),
  async (req, res, next) => {
    try {
      const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
      const { role } = req.body as z.infer<typeof teamPatchSchema>;
      const tenantId = req.tenantContext!.tenantId;

      const membership = await prisma.tenantMembership.findFirst({
        where: {
          id: membershipId,
          tenantId
        }
      });
      if (!membership) {
        throw new ApiError(404, 'membership_not_found', 'Team member not found.');
      }

      const updated = await prisma.tenantMembership.update({
        where: { id: membership.id },
        data: {
          role: membershipRoleToPrisma(role)
        }
      });

      await prisma.user.update({
        where: { id: membership.userId },
        data: {
          role: role === 'tenant_admin' ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE
        }
      });

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'team.update_role',
        entityType: 'tenant_membership',
        entityId: membership.id,
        tenantId
      });

      res.json({
        data: {
          id: updated.id,
          role: updated.role.toLowerCase()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);
