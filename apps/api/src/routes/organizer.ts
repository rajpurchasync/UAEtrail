import { ActivityType, EventStatus, LocationStatus, MembershipRole, NotificationType, RequestStatus, TenantType, UserRole } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { assertCanApproveRequest } from '../services/join-request.js';
import { promptPostEventReview } from '../services/review-prompt.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { randomToken } from '../lib/hash.js';
import { toEventDto, toLocationDto, buildEventDto } from '../lib/mappers.js';
import { paginate, paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { hashPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireMembershipRole, requireTenantContext } from '../middleware/tenant.js';
import { notifyRequestDecision, notifyEventCancelled } from '../lib/email.js';
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
  images: z.array(z.string()).default([]),
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

import { parseLocalDateTime } from '../lib/datetime.js';

const membershipRoleToPrisma = (role: 'tenant_admin' | 'tenant_guide'): MembershipRole =>
  role === 'tenant_admin' ? MembershipRole.TENANT_ADMIN : MembershipRole.TENANT_GUIDE;

export const organizerRouter = Router();

organizerRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

organizerRouter.get('/events', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const where = { tenantId };
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

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { countryCode: true } });
    const countryCode = tenant?.countryCode ?? location.countryCode ?? 'AE';

    const created = await prisma.event.create({
      data: {
        tenantId,
        locationId: body.locationId,
        createdById: req.auth!.userId,
        guideId: body.guideId ?? req.auth!.userId,
        title: body.title,
        description: body.description,
        startAt: parseLocalDateTime(body.date, body.time, countryCode),
        endAt: body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined,
        meetingPoint: body.meetingPoint,
        itinerary: body.itinerary,
        requirements: body.requirements,
        images: body.images,
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
      data: buildEventDto(created)
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

    const existing = await prisma.event.findFirst({
      where: { id, tenantId },
      include: { participants: { select: { id: true } } }
    });
    if (!existing) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }
    if (existing.status === EventStatus.CANCELLED || existing.status === EventStatus.SUSPENDED) {
      throw new ApiError(400, 'event_not_editable', `Cannot edit an event that is ${existing.status.toLowerCase()}.`);
    }
    if (body.capacity !== undefined && body.capacity < existing.participants.length) {
      throw new ApiError(400, 'capacity_too_low', `Capacity cannot be less than current participants (${existing.participants.length}).`);
    }

    const tenantMeta = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { countryCode: true } });
    const countryCode = tenantMeta?.countryCode ?? 'AE';

    const updated = await prisma.event.update({
      where: { id },
      data: {
        locationId: body.locationId,
        title: body.title,
        description: body.description,
        startAt: body.date && body.time ? parseLocalDateTime(body.date, body.time, countryCode) : undefined,
        endAt: body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined,
        meetingPoint: body.meetingPoint,
        itinerary: body.itinerary,
        requirements: body.requirements,
        images: body.images,
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
      data: buildEventDto(updated)
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
      },
      include: {
        participants: { select: { userId: true } }
      }
    });
    if (!event) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }
    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.CANCELLED }
    });

    // Notify all participants about the cancellation
    if (event.participants.length > 0) {
      await prisma.notification.createMany({
        data: event.participants.map((p) => ({
          userId: p.userId,
          title: 'Event Cancelled',
          body: `The event "${event.title}" has been cancelled by the organizer.`,
          type: NotificationType.EVENT,
          meta: { eventId: event.id }
        }))
      });
    }

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
    if (event.status !== EventStatus.DRAFT) {
      throw new ApiError(400, 'event_not_draft', 'Only draft events can be published.');
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
    const pg = paginationSchema.parse(req.query);
    const where = { event: { tenantId } };
    const [requests, total] = await Promise.all([
      prisma.eventRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(pg),
        include: {
          event: {
            include: {
              location: true
            }
          },
          user: { include: { profile: true } }
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
      })),
      total,
      pg
    ));
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
        user: { include: { profile: true } },
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
        assertCanApproveRequest(freshEvent.capacity, freshEvent.participants.length);

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

    const userName = request.user.profile?.displayName ?? request.user.email.split('@')[0];
    const eventDate = request.event.startAt.toISOString().slice(0, 10);
    notifyRequestDecision({
      to: request.user.email,
      userName,
      eventTitle: request.event.title,
      eventDate,
      approved: status === 'approved',
      note: organizerNote
    }).catch(() => undefined);

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
      let isNewUser = false;
      if (!user) {
        const tempPassword = `Temp#${randomToken(6)}`;
        user = await prisma.user.create({
          data: {
            email: body.email,
            passwordHash: await hashPassword(tempPassword),
            role: role === MembershipRole.TENANT_ADMIN ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE,
            emailVerifiedAt: new Date(),
            profile: {
              create: {
                displayName: body.displayName ?? body.email.split('@')[0]
              }
            }
          },
          include: { profile: true }
        });
        isNewUser = true;
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

      // For new users, create a password reset token so they can set their own password
      let resetToken: string | undefined;
      if (isNewUser) {
        resetToken = randomToken(24);
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token: resetToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for invites
          }
        });
      }

      res.status(201).json({
        data: {
          id: membership.id,
          userId: user.id,
          email: user.email,
          displayName: user.profile?.displayName ?? user.email,
          role: membership.role.toLowerCase(),
          isNewUser,
          resetToken: isNewUser ? resetToken : undefined
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

// ─── Participant Check-in ───────────────────────────────────────────────────

const participantIdSchema = z.object({
  id: z.string().min(1),
  participantId: z.string().min(1)
});

organizerRouter.get('/events/:id/participants', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;

    const event = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!event) throw new ApiError(404, 'event_not_found', 'Event not found.');

    const participants = await prisma.eventParticipant.findMany({
      where: { eventId: id },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      data: {
        eventId: id,
        eventTitle: event.title,
        capacity: event.capacity,
        participants: participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          displayName: p.user.profile?.displayName ?? p.user.email,
          email: p.user.email,
          phone: p.user.profile?.phone ?? null,
          avatarUrl: p.user.profile?.avatarUrl ?? null,
          checkedInAt: p.checkedInAt,
          joinedAt: p.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

organizerRouter.post('/events/:id/participants/:participantId/checkin', validate({ params: participantIdSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

    const event = await prisma.event.findFirst({
      where: { id, tenantId },
      include: { location: true }
    });
    if (!event) throw new ApiError(404, 'event_not_found', 'Event not found.');

    const participant = await prisma.eventParticipant.findFirst({
      where: { id: participantId, eventId: id },
      include: { user: true }
    });
    if (!participant) throw new ApiError(404, 'participant_not_found', 'Participant not found.');

    await prisma.eventParticipant.update({
      where: { id: participantId },
      data: { checkedInAt: new Date() }
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'participant.checkin',
      entityType: 'event_participant',
      entityId: participantId,
      tenantId
    });

    const activityType = event.location.activityType === 'HIKING' ? 'hiking' : 'camping';
    await promptPostEventReview(prisma, {
      userId: participant.userId,
      eventId: event.id,
      locationId: event.locationId,
      locationName: event.location.name,
      activityType
    });

    res.json({ message: 'Participant checked in.' });
  } catch (error) {
    next(error);
  }
});

organizerRouter.delete('/events/:id/participants/:participantId/checkin', validate({ params: participantIdSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

    const event = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!event) throw new ApiError(404, 'event_not_found', 'Event not found.');

    const participant = await prisma.eventParticipant.findFirst({ where: { id: participantId, eventId: id } });
    if (!participant) throw new ApiError(404, 'participant_not_found', 'Participant not found.');

    await prisma.eventParticipant.update({
      where: { id: participantId },
      data: { checkedInAt: null }
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'participant.undo_checkin',
      entityType: 'event_participant',
      entityId: participantId,
      tenantId
    });

    res.json({ message: 'Check-in undone.' });
  } catch (error) {
    next(error);
  }
});

// ─── Location Submission ────────────────────────────────────────────────────

const locationSubmitSchema = z.object({
  name: z.string().min(2),
  region: z.string().min(2),
  activityType: z.enum(['hiking', 'camping']),
  description: z.string().min(20),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  season: z.array(z.string()).min(1),
  childFriendly: z.boolean().default(false),
  maxGroupSize: z.number().int().positive().optional(),
  accessibility: z.enum(['car-accessible', 'remote']).optional(),
  images: z.array(z.string().url()).default([]),
  featured: z.boolean().default(false)
});

const toPrismaActivityType = (activityType: 'hiking' | 'camping'): ActivityType =>
  activityType === 'hiking' ? ActivityType.HIKING : ActivityType.CAMPING;

organizerRouter.post('/locations', validate({ body: locationSubmitSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof locationSubmitSchema>;

    const created = await prisma.location.create({
      data: {
        name: body.name,
        region: body.region,
        activityType: toPrismaActivityType(body.activityType),
        description: body.description,
        difficulty: body.difficulty ? body.difficulty.toUpperCase() as 'EASY' | 'MODERATE' | 'HARD' : undefined,
        season: body.season,
        childFriendly: body.childFriendly,
        maxGroupSize: body.maxGroupSize,
        accessibility: body.accessibility === 'car-accessible' ? 'CAR_ACCESSIBLE' : body.accessibility === 'remote' ? 'REMOTE' : undefined,
        images: body.images,
        featured: body.featured,
        status: LocationStatus.INACTIVE,
        submittedById: req.auth!.userId
      }
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.submit',
      entityType: 'location',
      entityId: created.id,
      tenantId: req.tenantContext!.tenantId
    });

    res.status(201).json({ data: toLocationDto(created) });
  } catch (error) {
    next(error);
  }
});

// ─── Event History ──────────────────────────────────────────────────────────

organizerRouter.get('/events/history', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const where = {
      tenantId,
      startAt: { lt: new Date() }
    };
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startAt: 'desc' },
        ...paginate(pg),
        include: {
          location: true,
          participants: { select: { id: true, checkedInAt: true } }
        }
      }),
      prisma.event.count({ where })
    ]);

    res.json(paginatedResponse(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        locationName: e.location.name,
        activityType: e.location.activityType.toLowerCase(),
        startAt: e.startAt,
        status: e.status.toLowerCase(),
        capacity: e.capacity,
        participantCount: e.participants.length,
        checkedInCount: e.participants.filter((p) => p.checkedInAt !== null).length
      })),
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});
