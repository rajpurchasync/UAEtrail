import {
  Accessibility,
  ActivityType,
  Difficulty,
  EventStatus,
  LocationStatus,
  MembershipRole,
  OrganizerApplicationStatus,
  RequestStatus,
  TenantStatus,
  TenantType,
  UserRole,
  UserStatus
} from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { toEventDto, toLocationDto } from '../lib/mappers.js';
import { prisma } from '../lib/prisma.js';
import { slugify } from '../lib/slug.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const locationCreateSchema = z.object({
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
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'inactive']).default('active'),
  distance: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  elevation: z.number().int().nonnegative().optional(),
  campingType: z.enum(['self-guided', 'operator-led']).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  highlights: z.array(z.string()).default([])
});

const locationPatchSchema = locationCreateSchema.partial();

const applicationPatchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewerNote: z.string().max(300).optional()
});

const eventModerationSchema = z.object({
  action: z.enum(['suspend', 'unsuspend'])
});

const idParamSchema = z.object({ id: z.string().min(1) });

const ensureUniqueTenantSlug = async (baseSlug: string): Promise<string> => {
  let candidate = slugify(baseSlug);
  let attempt = 1;
  while (await prisma.tenant.findUnique({ where: { slug: candidate } })) {
    candidate = `${baseSlug}-${attempt}`;
    attempt += 1;
  }
  return candidate;
};

const toPrismaActivityType = (activityType: 'hiking' | 'camping'): ActivityType =>
  activityType === 'hiking' ? 'HIKING' : 'CAMPING';

const toPrismaDifficulty = (difficulty?: 'easy' | 'moderate' | 'hard'): Difficulty | undefined => {
  if (!difficulty) return undefined;
  if (difficulty === 'easy') return Difficulty.EASY;
  if (difficulty === 'moderate') return Difficulty.MODERATE;
  return Difficulty.HARD;
};

const toPrismaAccessibility = (
  accessibility?: 'car-accessible' | 'remote'
): Accessibility | undefined => {
  if (!accessibility) return undefined;
  return accessibility === 'car-accessible' ? 'CAR_ACCESSIBLE' : 'REMOTE';
};

const toPrismaLocationStatus = (status?: 'draft' | 'active' | 'inactive'): LocationStatus | undefined => {
  if (!status) return undefined;
  if (status === 'draft') return 'DRAFT';
  return status === 'active' ? 'ACTIVE' : 'INACTIVE';
};

export const adminRouter = Router();

adminRouter.use(requireAuth, requireVerifiedEmail, requireRole([UserRole.PLATFORM_ADMIN]));

adminRouter.get('/locations', async (_req, res, next) => {
  try {
    const locations = await prisma.location.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: locations.map(toLocationDto) });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/locations', validate({ body: locationCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof locationCreateSchema>;
    const created = await prisma.location.create({
      data: {
        name: body.name,
        region: body.region,
        activityType: toPrismaActivityType(body.activityType),
        description: body.description,
        difficulty: toPrismaDifficulty(body.difficulty),
        season: body.season,
        childFriendly: body.childFriendly,
        maxGroupSize: body.maxGroupSize,
        accessibility: toPrismaAccessibility(body.accessibility),
        images: body.images,
        featured: body.featured,
        status: toPrismaLocationStatus(body.status) ?? LocationStatus.ACTIVE,
        distance: body.distance,
        duration: body.duration,
        elevation: body.elevation,
        campingType: body.campingType,
        latitude: body.latitude,
        longitude: body.longitude,
        highlights: body.highlights ?? []
      }
    });
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.create',
      entityType: 'location',
      entityId: created.id
    });
    res.status(201).json({ data: toLocationDto(created) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/locations/:id', validate({ params: idParamSchema, body: locationPatchSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof locationPatchSchema>;

    const updated = await prisma.location.update({
      where: { id },
      data: {
        name: body.name,
        region: body.region,
        activityType: body.activityType ? toPrismaActivityType(body.activityType) : undefined,
        description: body.description,
        difficulty: toPrismaDifficulty(body.difficulty),
        season: body.season,
        childFriendly: body.childFriendly,
        maxGroupSize: body.maxGroupSize,
        accessibility: toPrismaAccessibility(body.accessibility),
        images: body.images,
        featured: body.featured,
        status: toPrismaLocationStatus(body.status),
        distance: body.distance,
        duration: body.duration,
        elevation: body.elevation,
        campingType: body.campingType,
        latitude: body.latitude,
        longitude: body.longitude,
        highlights: body.highlights
      }
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.update',
      entityType: 'location',
      entityId: updated.id
    });

    res.json({ data: toLocationDto(updated) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/organizer-applications', async (_req, res, next) => {
  try {
    const applications = await prisma.organizerApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: { include: { profile: true } }
      }
    });

    res.json({
      data: applications.map((item) => ({
        id: item.id,
        applicantId: item.applicantId,
        applicantEmail: item.applicant.email,
        applicantName: item.applicant.profile?.displayName ?? item.applicant.email,
        requestedName: item.requestedName,
        requestedType: item.requestedType.toLowerCase(),
        requestedSlug: item.requestedSlug,
        status: item.status.toLowerCase(),
        reviewerNote: item.reviewerNote,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch(
  '/organizer-applications/:id',
  validate({ params: idParamSchema, body: applicationPatchSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const { status, reviewerNote } = req.body as z.infer<typeof applicationPatchSchema>;

      const application = await prisma.organizerApplication.findUnique({ where: { id } });
      if (!application) {
        throw new ApiError(404, 'application_not_found', 'Organizer application was not found.');
      }
      if (application.status !== OrganizerApplicationStatus.PENDING) {
        throw new ApiError(400, 'application_finalized', 'Application is already finalized.');
      }

      if (status === 'approved') {
        const tenantSlug = await ensureUniqueTenantSlug(application.requestedSlug);
        await prisma.$transaction(async (tx) => {
          const tenant = await tx.tenant.create({
            data: {
              name: application.requestedName,
              slug: tenantSlug,
              type: application.requestedType as TenantType,
              status: TenantStatus.ACTIVE,
              ownerId: application.applicantId
            }
          });

          await tx.tenantMembership.create({
            data: {
              tenantId: tenant.id,
              userId: application.applicantId,
              role: MembershipRole.TENANT_OWNER
            }
          });

          await tx.user.update({
            where: { id: application.applicantId },
            data: { role: UserRole.TENANT_OWNER }
          });

          await tx.organizerApplication.update({
            where: { id: application.id },
            data: {
              requestedTenantId: tenant.id,
              status: OrganizerApplicationStatus.APPROVED,
              reviewerId: req.auth!.userId,
              reviewerNote,
              reviewedAt: new Date()
            }
          });
        });
      } else {
        await prisma.organizerApplication.update({
          where: { id: application.id },
          data: {
            status: OrganizerApplicationStatus.REJECTED,
            reviewerId: req.auth!.userId,
            reviewerNote,
            reviewedAt: new Date()
          }
        });
      }

      await createAuditLog({
        actorId: req.auth!.userId,
        action: `organizer_application.${status}`,
        entityType: 'organizer_application',
        entityId: id
      });

      res.json({ message: `Application ${status}.` });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get('/events/moderation', async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
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

adminRouter.patch(
  '/events/moderation/:id',
  validate({ params: idParamSchema, body: eventModerationSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const { action } = req.body as z.infer<typeof eventModerationSchema>;
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) {
        throw new ApiError(404, 'event_not_found', 'Event not found.');
      }

      const status = action === 'suspend' ? EventStatus.SUSPENDED : EventStatus.PUBLISHED;
      await prisma.event.update({
        where: { id: event.id },
        data: { status }
      });

      await createAuditLog({
        actorId: req.auth!.userId,
        action: `event.${action}`,
        entityType: 'event',
        entityId: event.id,
        tenantId: event.tenantId
      });

      res.json({ message: `Event ${action}ed successfully.` });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get('/metrics', async (_req, res, next) => {
  try {
    const [tenantCount, eventCount, pendingApplications, pendingRequests, totalUsers, activeUsers, totalLocations, totalParticipants] = await Promise.all([
      prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      prisma.event.count(),
      prisma.organizerApplication.count({ where: { status: OrganizerApplicationStatus.PENDING } }),
      prisma.eventRequest.count({ where: { status: RequestStatus.PENDING } }),
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.location.count(),
      prisma.eventParticipant.count()
    ]);

    res.json({
      data: {
        tenants: tenantCount,
        events: eventCount,
        pendingApplications,
        pendingRequests,
        totalUsers,
        activeUsers,
        totalLocations,
        totalParticipants
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── User Management ────────────────────────────────────────────────────────

const userListQuerySchema = z.object({
  role: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

adminRouter.get('/users', validate({ query: userListQuerySchema }), async (req, res, next) => {
  try {
    const { role, status, search, page, pageSize } = req.query as unknown as z.infer<typeof userListQuerySchema>;

    const where: Record<string, unknown> = {};
    if (role) where.role = role.toUpperCase() as UserRole;
    if (status) where.status = status.toUpperCase() as UserStatus;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { displayName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role.toLowerCase(),
        status: u.status.toLowerCase(),
        displayName: u.profile?.displayName ?? null,
        avatarUrl: u.profile?.avatarUrl ?? null,
        createdAt: u.createdAt
      })),
      total,
      page,
      pageSize
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/users/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        memberships: { include: { tenant: true } },
        requests: {
          include: { event: { include: { location: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        participants: {
          include: { event: { include: { location: true, tenant: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }

    res.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
        status: user.status.toLowerCase(),
        createdAt: user.createdAt,
        profile: user.profile ? {
          displayName: user.profile.displayName,
          phone: user.profile.phone,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl
        } : null,
        memberships: user.memberships.map((m) => ({
          tenantId: m.tenantId,
          tenantName: m.tenant.name,
          role: m.role.toLowerCase(),
          joinedAt: m.createdAt
        })),
        requests: user.requests.map((r) => ({
          id: r.id,
          eventId: r.eventId,
          eventTitle: r.event.title,
          locationName: r.event.location.name,
          status: r.status.toLowerCase(),
          createdAt: r.createdAt
        })),
        trips: user.participants.map((p) => ({
          eventId: p.eventId,
          eventTitle: p.event.title,
          locationName: p.event.location.name,
          organizerName: p.event.tenant.name,
          date: p.event.startAt.toISOString().slice(0, 10),
          checkedInAt: p.checkedInAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

const userStatusSchema = z.object({
  status: z.enum(['active', 'suspended'])
});

adminRouter.patch('/users/:id/status', validate({ params: idParamSchema, body: userStatusSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { status } = req.body as z.infer<typeof userStatusSchema>;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'user_not_found', 'User not found.');
    if (user.role === UserRole.PLATFORM_ADMIN) throw new ApiError(400, 'cannot_modify_admin', 'Cannot modify admin status.');

    const prismaStatus = status === 'active' ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
    await prisma.user.update({ where: { id }, data: { status: prismaStatus } });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `user.${status === 'active' ? 'activate' : 'suspend'}`,
      entityType: 'user',
      entityId: id
    });

    res.json({ message: `User ${status === 'active' ? 'activated' : 'suspended'}.` });
  } catch (error) {
    next(error);
  }
});

// ─── Tenant Oversight ───────────────────────────────────────────────────────

adminRouter.get('/tenants', async (_req, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { include: { profile: true } },
        _count: { select: { memberships: true, events: true } }
      }
    });

    res.json({
      data: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        type: t.type.toLowerCase(),
        status: t.status.toLowerCase(),
        ownerName: t.owner.profile?.displayName ?? t.owner.email,
        ownerEmail: t.owner.email,
        memberCount: t._count.memberships,
        eventCount: t._count.events,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/tenants/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: { include: { profile: true } },
        memberships: { include: { user: { include: { profile: true } } } },
        events: {
          orderBy: { startAt: 'desc' },
          include: {
            location: true,
            participants: { select: { id: true, checkedInAt: true } },
            guide: { include: { profile: true } }
          }
        }
      }
    });

    if (!tenant) throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');

    res.json({
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type.toLowerCase(),
        status: tenant.status.toLowerCase(),
        owner: {
          id: tenant.owner.id,
          email: tenant.owner.email,
          displayName: tenant.owner.profile?.displayName ?? null
        },
        createdAt: tenant.createdAt,
        members: tenant.memberships.map((m) => ({
          userId: m.userId,
          email: m.user.email,
          displayName: m.user.profile?.displayName ?? null,
          role: m.role.toLowerCase(),
          joinedAt: m.createdAt
        })),
        events: tenant.events.map((e) => ({
          id: e.id,
          title: e.title,
          locationName: e.location.name,
          startAt: e.startAt,
          status: e.status.toLowerCase(),
          capacity: e.capacity,
          participantCount: e.participants.length,
          checkedInCount: e.participants.filter((p) => p.checkedInAt !== null).length,
          guideName: e.guide?.profile?.displayName ?? null
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

const tenantStatusSchema = z.object({
  status: z.enum(['active', 'suspended'])
});

adminRouter.patch('/tenants/:id/status', validate({ params: idParamSchema, body: tenantStatusSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { status } = req.body as z.infer<typeof tenantStatusSchema>;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');

    const prismaStatus = status === 'active' ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED;
    await prisma.tenant.update({ where: { id }, data: { status: prismaStatus } });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `tenant.${status === 'active' ? 'activate' : 'suspend'}`,
      entityType: 'tenant',
      entityId: id
    });

    res.json({ message: `Tenant ${status === 'active' ? 'activated' : 'suspended'}.` });
  } catch (error) {
    next(error);
  }
});

// ─── Location Delete ────────────────────────────────────────────────────────

adminRouter.delete('/locations/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;

    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) throw new ApiError(404, 'location_not_found', 'Location not found.');

    const activeEventCount = await prisma.event.count({
      where: { locationId: id, status: { in: [EventStatus.PUBLISHED, EventStatus.DRAFT] } }
    });
    if (activeEventCount > 0) {
      throw new ApiError(400, 'location_has_events', `Cannot delete location: ${activeEventCount} active event(s) reference it.`);
    }

    await prisma.location.delete({ where: { id } });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.delete',
      entityType: 'location',
      entityId: id
    });

    res.json({ message: 'Location deleted.' });
  } catch (error) {
    next(error);
  }
});

// ─── Audit Logs ─────────────────────────────────────────────────────────────

const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

adminRouter.get('/audit-logs', validate({ query: auditLogQuerySchema }), async (req, res, next) => {
  try {
    const { action, entityType, page, pageSize } = req.query as unknown as z.infer<typeof auditLogQuerySchema>;

    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action };
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      data: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        actorEmail: l.actor.email,
        actorName: l.actor.profile?.displayName ?? null,
        tenantId: l.tenantId,
        metadata: l.metadata,
        createdAt: l.createdAt
      })),
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    next(error);
  }
});

// ─── System Notifications ───────────────────────────────────────────────────

const sendNotificationSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(2).max(1000),
  targetRole: z.string().optional()
});

adminRouter.post('/notifications', validate({ body: sendNotificationSchema }), async (req, res, next) => {
  try {
    const { title, body, targetRole } = req.body as z.infer<typeof sendNotificationSchema>;

    const userWhere: Record<string, unknown> = { status: UserStatus.ACTIVE };
    if (targetRole) userWhere.role = targetRole.toUpperCase() as UserRole;

    const users = await prisma.user.findMany({ where: userWhere, select: { id: true } });

    if (users.length === 0) {
      throw new ApiError(400, 'no_recipients', 'No users match the target criteria.');
    }

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        body,
        type: 'SYSTEM' as const
      }))
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'notification.broadcast',
      entityType: 'notification',
      entityId: 'system',
      metadata: { recipientCount: users.length, targetRole: targetRole ?? 'all' }
    });

    res.status(201).json({ data: { count: users.length } });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/notifications', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'notification.broadcast' },
      include: { actor: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      data: logs.map((l) => {
        const meta = l.metadata as Record<string, unknown> | null;
        return {
          id: l.id,
          title: 'System Notification',
          body: `Sent by ${l.actor.profile?.displayName ?? l.actor.email}`,
          targetRole: (meta?.targetRole as string) ?? null,
          recipientCount: (meta?.recipientCount as number) ?? 0,
          createdAt: l.createdAt
        };
      })
    });
  } catch (error) {
    next(error);
  }
});

// ─── Shop / Product Moderation ──────────────────────────────────────────────

const productListQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

adminRouter.get('/products', validate({ query: productListQuerySchema }), async (req, res, next) => {
  try {
    const { status, category, page, pageSize } = req.query as unknown as z.infer<typeof productListQuerySchema>;

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();
    if (category) where.category = category;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { merchant: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images as string[],
        priceAed: p.priceAed,
        discountPercent: p.discountPercent,
        packagingInfo: p.packagingInfo,
        category: p.category,
        status: p.status.toLowerCase(),
        merchantId: p.merchantId,
        merchantName: p.merchant.shopName
      })),
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    next(error);
  }
});

const productStatusSchema = z.object({
  status: z.enum(['active', 'inactive'])
});

adminRouter.patch('/products/:id/status', validate({ params: idParamSchema, body: productStatusSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { status } = req.body as z.infer<typeof productStatusSchema>;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new ApiError(404, 'product_not_found', 'Product not found.');

    const prismaStatus = status === 'active' ? 'ACTIVE' : 'INACTIVE';
    await prisma.product.update({ where: { id }, data: { status: prismaStatus as import('@prisma/client').ProductStatus } });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `product.${status === 'active' ? 'approve' : 'suspend'}`,
      entityType: 'product',
      entityId: id
    });

    res.json({ message: `Product ${status === 'active' ? 'approved' : 'suspended'}.` });
  } catch (error) {
    next(error);
  }
});
