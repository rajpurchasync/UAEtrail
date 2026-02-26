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
  UserRole
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
  status: z.enum(['active', 'inactive']).default('active')
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

const toPrismaLocationStatus = (status?: 'active' | 'inactive'): LocationStatus | undefined => {
  if (!status) return undefined;
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
        status: toPrismaLocationStatus(body.status) ?? LocationStatus.ACTIVE
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
        status: toPrismaLocationStatus(body.status)
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
    const [tenantCount, eventCount, pendingApplications, pendingRequests] = await Promise.all([
      prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      prisma.event.count(),
      prisma.organizerApplication.count({ where: { status: OrganizerApplicationStatus.PENDING } }),
      prisma.eventRequest.count({ where: { status: RequestStatus.PENDING } })
    ]);

    res.json({
      data: {
        tenants: tenantCount,
        events: eventCount,
        pendingApplications,
        pendingRequests
      }
    });
  } catch (error) {
    next(error);
  }
});
