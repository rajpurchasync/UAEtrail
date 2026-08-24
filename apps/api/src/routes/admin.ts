import {
  Accessibility,
  ActivityType,
  Difficulty,
  EventStatus,
  LocationStatus,
  NotificationType,
  OrganizerApplicationStatus,
  ProductStatus,
  RewardAction,
  TenantStatus,
  TenantType,
  UserRole,
  UserStatus
} from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { parseLocalDateTime } from '../lib/datetime.js';
import { toLocationDto, buildEventDto } from '../lib/mappers.js';
import { paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { revokeRefreshTokensByUser } from '../lib/auth-tokens.js';
import { adminUserTypeFilter, resolveAdminUserType } from '../lib/user-type.js';
import {
  countActiveEventsByLocationId,
  countAdminMetrics,
  createAdminLocation,
  createAdminPublishedEvent,
  deleteAdminLocation,
  findAdminEventById,
  findAdminEventDetailedById,
  findAdminLocationById,
  findAdminLocationByIdForEventCreate,
  findAdminProductById,
  findAdminTenantById,
  findAdminTenantDetailedById,
  listAdminLocationsPaged,
  listAdminModerationEventsPaged,
  listAdminProductsPaged,
  listAdminTenantsPaged,
  listAuditLogsPaged,
  listBroadcastNotificationAuditLogs,
  listEventsForAdminRequests,
  listEventsForAdminTrips,
  listUserHostedEventsBasic,
  listOwnerTenantTypes,
  listTenantMembershipsForUser,
  listUserOwnedTenantsBasic,
  toggleAdminEventFeatured,
  updateAdminEventStatus,
  updateAdminLocation,
  updateAdminProductStatus,
  updateAdminTenantStatus
} from '../lib/admin-store.js';
import {
  countEventParticipants,
  countPendingEventRequests,
  listUserEventParticipantsBasic,
  listUserEventRequestsBasic
} from '../lib/event-engagement-store.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { countAuthUsers, findAuthUserById, listAuthUsers, updateAuthUserStatus } from '../lib/auth-users.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import {
  approveOrganizerApplicationAndProvisionTenant,
  countOrganizerApplications,
  findOrganizerApplicationById,
  listOrganizerApplicationsDetailed,
  markOrganizerApplicationRejected
} from '../lib/organizer-applications-store.js';
import { dispatchNotificationDefault } from '../services/notifications.js';
import { notifyUserAdminAction } from '../services/admin-notifications.js';
import { awardPointsDefault, getRewardSummaryDefault, getUserLeaderboardRank } from '../services/rewards.js';
import {
  countSocialGroups,
  getSocialGroupAdminDetail,
  listAllSocialGroupsAdmin,
  listUserGroupsWithMembership,
  updateGroupStatus
} from '../lib/social-groups-store.js';

const locationCreateSchema = z.object({
  name: z.string().min(2),
  region: z.string().min(2),
  activityType: z.enum(['hiking', 'camping', 'community_event']),
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
  highlights: z.array(z.string()).default([]),
  surfaceType: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  parkingLink: z.string().max(500).optional().nullable(),
  accessibleBy: z.array(z.string()).default([]),
  countryCode: z.string().length(2).optional(),
  gpxKey: z.string().max(500).optional().nullable(),
  guidePdfKey: z.string().max(500).optional().nullable(),
  guideMarkdown: z.string().max(50000).optional().nullable(),
  guidePreview: z.string().max(2000).optional().nullable(),
  unlockPriceAed: z.number().int().min(0).max(9999).optional()
});

const locationPatchSchema = locationCreateSchema.partial();

const applicationPatchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewerNote: z.string().max(300).optional()
});

const suspendCommentSchema = z.object({
  comment: z.string().trim().max(500).optional()
});

const requireSuspendComment = (
  data: { comment?: string },
  isSuspend: boolean,
  ctx: z.RefinementCtx
) => {
  if (isSuspend && (!data.comment || data.comment.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Comment is required when suspending.',
      path: ['comment']
    });
  }
};

const eventModerationSchema = suspendCommentSchema.extend({
  action: z.enum(['suspend', 'unsuspend'])
}).superRefine((data, ctx) => requireSuspendComment(data, data.action === 'suspend', ctx));

const idParamSchema = z.object({ id: z.string().min(1) });

const toPrismaActivityType = (activityType: 'hiking' | 'camping' | 'community_event'): ActivityType => {
  if (activityType === 'hiking') return ActivityType.HIKING;
  if (activityType === 'camping') return ActivityType.CAMPING;
  return ActivityType.COMMUNITY_EVENT;
};

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

adminRouter.get('/locations', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const { items: locations, total } = await listAdminLocationsPaged({
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize
    });
    res.json(paginatedResponse(locations.map((l) => toLocationDto(l, { admin: true })), total, pg));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/locations', validate({ body: locationCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof locationCreateSchema>;
    const created = await createAdminLocation({
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
      highlights: body.highlights ?? [],
      surfaceType: body.surfaceType ?? [],
      tags: body.tags ?? [],
      parkingLink: body.parkingLink,
      accessibleBy: body.accessibleBy ?? [],
      countryCode: body.countryCode?.toUpperCase() ?? 'AE'
    });
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.create',
      entityType: 'location',
      entityId: created.id
    });
    res.status(201).json({ data: toLocationDto(created, { admin: true }) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/locations/:id', validate({ params: idParamSchema, body: locationPatchSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof locationPatchSchema>;

    const existing = await findAdminLocationById(id);
    if (!existing) {
      throw new ApiError(404, 'location_not_found', 'Location not found.');
    }

    const nextStatus = toPrismaLocationStatus(body.status);
    const activating =
      nextStatus === LocationStatus.ACTIVE &&
      (existing.status === LocationStatus.DRAFT || existing.status === LocationStatus.INACTIVE);
    const deactivating =
      nextStatus === LocationStatus.INACTIVE && existing.status === LocationStatus.ACTIVE;

    if (activating) {
      const activityType = body.activityType
        ? toPrismaActivityType(body.activityType)
        : existing.activityType;
      const difficulty = body.difficulty
        ? toPrismaDifficulty(body.difficulty)
        : existing.difficulty;
      const parkingLink = body.parkingLink !== undefined ? body.parkingLink : existing.parkingLink;
      const latitude = body.latitude !== undefined ? body.latitude : existing.latitude;
      const longitude = body.longitude !== undefined ? body.longitude : existing.longitude;

      if (
        (activityType === ActivityType.HIKING || activityType === ActivityType.COMMUNITY_EVENT) &&
        !difficulty
      ) {
        throw new ApiError(
          400,
          'difficulty_required',
          'Trail and community event locations require a difficulty level before approval.'
        );
      }
      if (!parkingLink && (latitude == null || longitude == null)) {
        throw new ApiError(
          400,
          'parking_required',
          'Add a parking link or map coordinates before approving this location.'
        );
      }
    }

    const updated = await updateAdminLocation(id, {
      name: body.name,
      region: body.region,
      countryCode: body.countryCode?.toUpperCase(),
      activityType: body.activityType ? toPrismaActivityType(body.activityType) : undefined,
      description: body.description,
      difficulty: toPrismaDifficulty(body.difficulty),
      season: body.season,
      childFriendly: body.childFriendly,
      maxGroupSize: body.maxGroupSize,
      accessibility: toPrismaAccessibility(body.accessibility),
      images: body.images,
      featured: body.featured,
      status: nextStatus,
      distance: body.distance,
      duration: body.duration,
      elevation: body.elevation,
      campingType: body.campingType,
      latitude: body.latitude,
      longitude: body.longitude,
      highlights: body.highlights,
      surfaceType: body.surfaceType,
      tags: body.tags,
      parkingLink: body.parkingLink,
      accessibleBy: body.accessibleBy,
      gpxKey: body.gpxKey,
      guidePdfKey: body.guidePdfKey,
      guideMarkdown: body.guideMarkdown,
      guidePreview: body.guidePreview,
      unlockPriceAed: body.unlockPriceAed
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: activating ? 'location.approve' : 'location.update',
      entityType: 'location',
      entityId: updated.id
    });

    if (activating && updated.submittedById) {
      await dispatchNotificationDefault({
        userId: updated.submittedById,
        title: 'Location approved',
        body: `"${updated.name}" is now live. You can use it when creating trips.`,
        type: NotificationType.SYSTEM,
        meta: { locationId: updated.id, kind: 'location_approved' }
      });
      void awardPointsDefault({
        userId: updated.submittedById,
        action: RewardAction.LOCATION_PUBLISHED,
        referenceId: updated.id,
        label: `Location approved: ${updated.name}`
      }).catch(() => undefined);
    }

    if (deactivating && updated.submittedById) {
      await notifyUserAdminAction({
        userId: updated.submittedById,
        title: 'Location not approved',
        body: `"${updated.name}" was not approved for listing. Contact support if you have questions.`,
        meta: { locationId: updated.id, kind: 'location_rejected', path: '/discovery' }
      });
    }

    res.json({ data: toLocationDto(updated, { admin: true }) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/organizer-applications', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const [applications, total] = await Promise.all([
      listOrganizerApplicationsDetailed({
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countOrganizerApplications()
    ]);

    res.json(paginatedResponse(
      applications.map((item) => ({
        id: item.id,
        applicantId: item.applicantId,
        applicantEmail: item.applicant.email,
        applicantName: item.applicant.profile?.displayName ?? item.applicant.email,
        requestedName: item.requestedName,
        requestedType: item.requestedType.toLowerCase(),
        requestedSlug: item.requestedSlug,
        requestedTenantId: item.requestedTenantId,
        status: item.status.toLowerCase(),
        reviewerNote: item.reviewerNote,
        reviewedAt: item.reviewedAt,
        metadata: item.metadata,
        createdAt: item.createdAt
      })),
      total,
      pg
    ));
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

      const application = await findOrganizerApplicationById(id);
      if (!application) {
        throw new ApiError(404, 'application_not_found', 'Organizer application was not found.');
      }
      if (application.status !== OrganizerApplicationStatus.PENDING) {
        throw new ApiError(400, 'application_finalized', 'Application is already finalized.');
      }

      if (status === 'approved') {
        await approveOrganizerApplicationAndProvisionTenant({
          applicationId: application.id,
          reviewerId: req.auth!.userId,
          reviewerNote
        });
        await notifyUserAdminAction({
          userId: application.applicantId,
          title: 'Host application approved',
          body: reviewerNote
            ? `You can now post events. Note from reviewer: ${reviewerNote}`
            : 'Your host profile was approved. You can now post events and welcome participants.',
          meta: {
            kind: 'organizer_application_approved',
            applicationId: application.id,
            path: '/organizer/overview'
          }
        });
      } else {
        await markOrganizerApplicationRejected({
          id: application.id,
          reviewerId: req.auth!.userId,
          reviewerNote
        });
        await notifyUserAdminAction({
          userId: application.applicantId,
          title: 'Host application not approved',
          body: reviewerNote
            ? reviewerNote
            : 'Your host application was not approved at this time. You can update your profile and apply again.',
          meta: {
            kind: 'organizer_application_rejected',
            applicationId: application.id,
            path: '/become-host'
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

// ─── Admin Event Creation ───────────────────────────────────────────────────

const adminEventCreateSchema = z.object({
  tenantId: z.string().min(1),
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
  images: z.array(z.string().url()).default([])
});

adminRouter.post('/events', validate({ body: adminEventCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof adminEventCreateSchema>;
    const tenant = await findAdminTenantById(body.tenantId);
    if (!tenant) throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
    const location = await findAdminLocationByIdForEventCreate(body.locationId);
    if (!location) throw new ApiError(404, 'location_not_found', 'Location not found.');

    const countryCode = tenant.countryCode ?? location.countryCode ?? 'AE';
    const startAt = parseLocalDateTime(body.date, body.time, countryCode);
    const endAt = body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined;

    const event = await createAdminPublishedEvent({
      tenantId: body.tenantId,
      locationId: body.locationId,
      createdById: req.auth!.userId,
      title: body.title,
      description: body.description,
      startAt,
      endAt,
      meetingPoint: body.meetingPoint,
      itinerary: body.itinerary,
      requirements: body.requirements,
      priceAed: body.price,
      capacity: body.capacity,
      images: body.images
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'event.admin_create',
      entityType: 'event',
      entityId: event.id,
      tenantId: event.tenantId
    });

    res.status(201).json({
      data: buildEventDto({ ...event, participants: [] })
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/events/moderation', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const { items: events, total } = await listAdminModerationEventsPaged({
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

adminRouter.get('/events/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const event = await findAdminEventDetailedById(id);
    if (!event) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }
    res.json({ data: buildEventDto(event) });
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
      const { action, comment } = req.body as z.infer<typeof eventModerationSchema>;
      const event = await findAdminEventById(id);
      if (!event) {
        throw new ApiError(404, 'event_not_found', 'Event not found.');
      }

      const status = action === 'suspend' ? EventStatus.SUSPENDED : EventStatus.PUBLISHED;
      await updateAdminEventStatus(event.id, status);

      await createAuditLog({
        actorId: req.auth!.userId,
        action: `event.${action}`,
        entityType: 'event',
        entityId: event.id,
        tenantId: event.tenantId,
        metadata: comment ? { comment } : undefined
      });

      if (action === 'suspend' && event.createdById) {
        await notifyUserAdminAction({
          userId: event.createdById,
          title: 'Event suspended',
          body: comment
            ? `Your event "${event.title}" has been suspended. Reason: ${comment}`
            : `Your event "${event.title}" has been suspended by an administrator.`,
          meta: { kind: 'event_suspended', eventId: event.id, path: '/organizer/events' }
        });
      }

      res.json({ message: `Event ${action}ed successfully.` });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Toggle Featured Event ──────────────────────────────────────────────────

adminRouter.patch(
  '/events/:id/featured',
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const event = await findAdminEventById(id);
      if (!event) {
        throw new ApiError(404, 'event_not_found', 'Event not found.');
      }

      const updated = await toggleAdminEventFeatured(event.id, !event.featured);

      await createAuditLog({
        actorId: req.auth!.userId,
        action: updated.featured ? 'event.feature' : 'event.unfeature',
        entityType: 'event',
        entityId: event.id,
        tenantId: event.tenantId
      });

      res.json({ message: `Event ${updated.featured ? 'featured' : 'unfeatured'} successfully.`, featured: updated.featured });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get('/metrics', async (_req, res, next) => {
  try {
    const now = new Date();
    const [metrics, pendingRequests, totalUsers, activeUsers, totalParticipants, totalOrganizers, totalGroups] = await Promise.all([
      countAdminMetrics(now),
      countPendingEventRequests(),
      countAuthUsers({}),
      countAuthUsers({ status: 'ACTIVE' }),
      countEventParticipants(),
      countAuthUsers({ role: ['TENANT_OWNER', 'PLATFORM_ADMIN'] }),
      countSocialGroups()
    ]);

    res.json({
      data: {
        tenants: metrics.tenantCount,
        events: metrics.eventCount,
        pendingApplications: metrics.pendingApplications,
        pendingRequests,
        totalUsers,
        activeUsers,
        totalLocations: metrics.totalLocations,
        totalParticipants,
        totalOrganizers,
        activeTrips: metrics.activeTrips,
        totalGroups
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── User Management ────────────────────────────────────────────────────────

const userListQuerySchema = z.object({
  role: z.string().optional(),
  userType: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

adminRouter.get('/users', validate({ query: userListQuerySchema }), async (req, res, next) => {
  try {
    const { role, userType, status, search, page, pageSize } = req.query as unknown as z.infer<typeof userListQuerySchema>;

    const typeFilter = userType ? adminUserTypeFilter(userType) : null;
    const useMongoCommonPath = !typeFilter || userType === 'participant' || userType === 'platform_admin' || userType === 'organizer_staff';

    if (useMongoCommonPath) {
      const authRoleFilter = role ? (role.toUpperCase() as UserRole) : typeFilter?.role ? typeFilter.role : undefined;
      const authStatusFilter = status ? (status.toUpperCase() as UserStatus) : undefined;
      const [users, total] = await Promise.all([
        listAuthUsers({
          role: authRoleFilter as UserRole | UserRole[] | undefined,
          status: authStatusFilter as 'ACTIVE' | 'SUSPENDED' | undefined,
          search,
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        countAuthUsers({
          role: authRoleFilter as UserRole | UserRole[] | undefined,
          status: authStatusFilter as 'ACTIVE' | 'SUSPENDED' | undefined,
          search
        })
      ]);

      const ownedTenantMap = new Map<string, { type: TenantType }[]>();
      const tenantOwnerIds = users.filter((u) => u.role === 'TENANT_OWNER').map((u) => u._id);
      if (tenantOwnerIds.length > 0) {
        const owners = await listOwnerTenantTypes(tenantOwnerIds);
        owners.forEach((tenant) => {
          const existing = ownedTenantMap.get(tenant.ownerId) ?? [];
          existing.push({ type: tenant.type });
          ownedTenantMap.set(tenant.ownerId, existing);
        });
      }

      res.json({
        data: users.map((u) => ({
          id: u._id,
          email: u.email,
          role: u.role.toLowerCase(),
          userType: resolveAdminUserType({ role: u.role, ownedTenants: ownedTenantMap.get(u._id) }),
          status: u.status.toLowerCase(),
          authProvider: u.authProvider.toLowerCase(),
          displayName: u.profile.displayName ?? null,
          avatarUrl: u.profile.avatarUrl ?? null,
          createdAt: u.createdAt,
          lastActiveAt: u.lastActiveAt
        })),
        total,
        page,
        pageSize
      });
      return;
    }

    const authRoleFilter = role ? (role.toUpperCase() as UserRole) : typeFilter?.role ? typeFilter.role : undefined;
    const authStatusFilter = status ? (status.toUpperCase() as UserStatus) : undefined;
    const [users, total] = await Promise.all([
      listAuthUsers({
        role: authRoleFilter as UserRole | UserRole[] | undefined,
        status: authStatusFilter as 'ACTIVE' | 'SUSPENDED' | undefined,
        search,
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      countAuthUsers({
        role: authRoleFilter as UserRole | UserRole[] | undefined,
        status: authStatusFilter as 'ACTIVE' | 'SUSPENDED' | undefined,
        search
      })
    ]);

    const ownedTenantMap = new Map<string, { type: TenantType }[]>();
    const tenantOwnerIds = users.filter((u) => u.role === 'TENANT_OWNER').map((u) => u._id);
    if (tenantOwnerIds.length > 0) {
      const owners = await listOwnerTenantTypes(tenantOwnerIds);
      owners.forEach((tenant) => {
        const existing = ownedTenantMap.get(tenant.ownerId) ?? [];
        existing.push({ type: tenant.type });
        ownedTenantMap.set(tenant.ownerId, existing);
      });
    }

    res.json({
      data: users.map((u) => ({
        id: u._id,
        email: u.email,
        role: u.role.toLowerCase(),
        userType: resolveAdminUserType({ role: u.role, ownedTenants: ownedTenantMap.get(u._id) }),
        status: u.status.toLowerCase(),
        authProvider: u.authProvider.toLowerCase(),
        displayName: u.profile.displayName ?? null,
        avatarUrl: u.profile.avatarUrl ?? null,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt
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

    const user = await findAuthUserById(id);

    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }

    const [ownedTenants, memberships, requests, participants, groups, hostedEvents, rewardSummary, leaderboardRank] = await Promise.all([
      listUserOwnedTenantsBasic(id),
      listTenantMembershipsForUser(id),
      listUserEventRequestsBasic(id, 20),
      listUserEventParticipantsBasic(id, 20),
      listUserGroupsWithMembership(id),
      listUserHostedEventsBasic(id, 20),
      getRewardSummaryDefault(id),
      getUserLeaderboardRank(id)
    ]);

    const requestEventIds = [...new Set(requests.map((request) => request.eventId))];
    const participantEventIds = [...new Set(participants.map((participant) => participant.eventId))];

    const [requestEvents, participantEvents] = await Promise.all([
      requestEventIds.length > 0
        ? listEventsForAdminRequests(requestEventIds)
        : Promise.resolve([]),
      participantEventIds.length > 0
        ? listEventsForAdminTrips(participantEventIds)
        : Promise.resolve([])
    ]);
    const requestEventMap = new Map(requestEvents.map((event) => [event.id, event]));
    const participantEventMap = new Map(participantEvents.map((event) => [event.id, event]));

    res.json({
      data: {
        id: user._id,
        email: user.email,
        role: user.role.toLowerCase(),
        userType: resolveAdminUserType({
          ...user,
          ownedTenants
        }),
        status: user.status.toLowerCase(),
        authProvider: user.authProvider.toLowerCase(),
        googleLinked: Boolean(user.googleId),
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        emailVerifiedAt: user.emailVerifiedAt,
        profile: user.profile ? {
          displayName: user.profile.displayName,
          phone: user.profile.phone,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl
        } : null,
        memberships: memberships.map((m: (typeof memberships)[number]) => ({
          tenantId: m.tenantId,
          tenantName: m.tenant.name,
          tenantSlug: m.tenant.slug,
          role: m.role.toLowerCase(),
          joinedAt: m.createdAt
        })),
        ownedTenants: ownedTenants.map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          type: tenant.type.toLowerCase(),
          status: tenant.status.toLowerCase()
        })),
        groups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          type: group.type,
          role: group.role,
          status: group.status,
          isCreator: group.role === 'admin',
          joinedAt: group.joinedAt
        })),
        hostedEvents,
        rewards: rewardSummary.trailPointsEligible === false ? null : {
          points: rewardSummary.points,
          membershipTier: rewardSummary.membershipTier,
          leaderboardRank,
          badgeCount: [...rewardSummary.tierBadges, ...rewardSummary.badges].filter((badge) => badge.earned).length
        },
        requests: requests.reduce<Array<{
          id: string;
          eventId: string;
          eventTitle: string | null;
          locationName: string;
          status: string;
          createdAt: Date;
        }>>((acc, r) => {
          const event = requestEventMap.get(r.eventId);
          if (!event) return acc;
          acc.push({
            id: r.id,
            eventId: r.eventId,
            eventTitle: event.title,
            locationName: event.location.name,
            status: r.status.toLowerCase(),
            createdAt: r.createdAt
          });
          return acc;
        }, []),
        trips: participants.reduce<Array<{
          eventId: string;
          eventTitle: string | null;
          locationName: string;
          organizerName: string;
          date: string;
          checkedInAt: Date | null;
        }>>((acc, p) => {
          const event = participantEventMap.get(p.eventId);
          if (!event) return acc;
          acc.push({
            eventId: p.eventId,
            eventTitle: event.title,
            locationName: event.location.name,
            organizerName: event.tenant.name,
            date: event.startAt.toISOString().slice(0, 10),
            checkedInAt: p.checkedInAt
          });
          return acc;
        }, [])
      }
    });
  } catch (error) {
    next(error);
  }
});

const userStatusSchema = suspendCommentSchema.extend({
  status: z.enum(['active', 'suspended'])
}).superRefine((data, ctx) => requireSuspendComment(data, data.status === 'suspended', ctx));

adminRouter.patch('/users/:id/status', validate({ params: idParamSchema, body: userStatusSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { status, comment } = req.body as z.infer<typeof userStatusSchema>;

    const user = await findAuthUserById(id);
    if (!user) throw new ApiError(404, 'user_not_found', 'User not found.');
    if (user.role === UserRole.PLATFORM_ADMIN) throw new ApiError(400, 'cannot_modify_admin', 'Cannot modify admin status.');

    const prismaStatus = status === 'active' ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
    await updateAuthUserStatus(id, prismaStatus);
    if (status === 'suspended') {
      await revokeRefreshTokensByUser(id);
    }

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `user.${status === 'active' ? 'activate' : 'suspend'}`,
      entityType: 'user',
      entityId: id,
      metadata: comment ? { comment } : undefined
    });

    await notifyUserAdminAction({
      userId: id,
      title: status === 'active' ? 'Account reactivated' : 'Account suspended',
      body:
        status === 'active'
          ? 'Your account access has been restored.'
          : comment
            ? `Your account has been suspended. Reason: ${comment}`
            : 'Your account has been suspended by an administrator. Contact support if you believe this is a mistake.',
      meta: {
        kind: status === 'active' ? 'user_reactivated' : 'user_suspended',
        path: '/profile'
      }
    });

    res.json({ message: `User ${status === 'active' ? 'activated' : 'suspended'}.` });
  } catch (error) {
    next(error);
  }
});

// ─── Tenant Oversight ───────────────────────────────────────────────────────

adminRouter.get('/tenants', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const { items: tenants, total } = await listAdminTenantsPaged({
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize
    });

    res.json(paginatedResponse(
      tenants.map((t) => ({
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
      })),
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/tenants/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;

    const tenant = await findAdminTenantDetailedById(id);

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

const tenantStatusSchema = suspendCommentSchema.extend({
  status: z.enum(['active', 'suspended'])
}).superRefine((data, ctx) => requireSuspendComment(data, data.status === 'suspended', ctx));

adminRouter.patch('/tenants/:id/status', validate({ params: idParamSchema, body: tenantStatusSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { status, comment } = req.body as z.infer<typeof tenantStatusSchema>;

    const tenant = await findAdminTenantById(id);
    if (!tenant) throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');

    const prismaStatus = status === 'active' ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED;
    await updateAdminTenantStatus(id, prismaStatus);

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `tenant.${status === 'active' ? 'activate' : 'suspend'}`,
      entityType: 'tenant',
      entityId: id,
      metadata: comment ? { comment } : undefined
    });

    await notifyUserAdminAction({
      userId: tenant.ownerId,
      title: status === 'active' ? 'Host account reopened' : 'Host account suspended',
      body:
        status === 'active'
          ? `Your host profile "${tenant.name}" is active again. You can create and manage events.`
          : comment
            ? `Your host profile "${tenant.name}" has been suspended. Reason: ${comment}`
            : `Your host profile "${tenant.name}" has been suspended. Contact support for details.`,
      meta: {
        kind: status === 'active' ? 'host_reopened' : 'host_suspended',
        tenantId: id,
        path: status === 'active' ? '/organizer/overview' : '/become-host'
      }
    });

    res.json({ message: `Tenant ${status === 'active' ? 'activated' : 'suspended'}.` });
  } catch (error) {
    next(error);
  }
});

const groupStatusSchema = suspendCommentSchema.extend({
  status: z.enum(['active', 'suspended'])
}).superRefine((data, ctx) => requireSuspendComment(data, data.status === 'suspended', ctx));

adminRouter.patch('/groups/:id/status', validate({ params: idParamSchema, body: groupStatusSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { status, comment } = req.body as z.infer<typeof groupStatusSchema>;

    const detail = await getSocialGroupAdminDetail(id);
    if (!detail) {
      throw new ApiError(404, 'group_not_found', 'Group not found.');
    }

    const updated = await updateGroupStatus(id, status);
    if (!updated) {
      throw new ApiError(404, 'group_not_found', 'Group not found.');
    }

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `group.${status === 'active' ? 'activate' : 'suspend'}`,
      entityType: 'group',
      entityId: id,
      metadata: comment ? { comment } : undefined
    });

    if (detail.admin) {
      await notifyUserAdminAction({
        userId: detail.admin.id,
        title: status === 'active' ? 'Group reactivated' : 'Group suspended',
        body:
          status === 'active'
            ? `Your group "${detail.group.name}" is active again.`
            : comment
              ? `Your group "${detail.group.name}" has been suspended. Reason: ${comment}`
              : `Your group "${detail.group.name}" has been suspended by an administrator.`,
        meta: { kind: status === 'active' ? 'group_reactivated' : 'group_suspended', groupId: id, path: '/groups' }
      });
    }

    res.json({ message: `Group ${status === 'active' ? 'activated' : 'suspended'}.` });
  } catch (error) {
    next(error);
  }
});

// ─── Location Delete ────────────────────────────────────────────────────────

adminRouter.delete('/locations/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;

    const location = await findAdminLocationById(id);
    if (!location) throw new ApiError(404, 'location_not_found', 'Location not found.');

    const activeEventCount = await countActiveEventsByLocationId(id);
    if (activeEventCount > 0) {
      throw new ApiError(400, 'location_has_events', `Cannot delete location: ${activeEventCount} active event(s) reference it.`);
    }

    await deleteAdminLocation(id);

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

    const where: { action?: string | { contains: string }; entityType?: string } = {};
    if (action) where.action = { contains: action };
    if (entityType) where.entityType = entityType;

    const { items: logs, total } = await listAuditLogsPaged({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

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

    const users = await listAuthUsers({
      status: 'ACTIVE',
      role: targetRole ? (targetRole.toUpperCase() as UserRole) : undefined,
      take: 10000
    });

    if (users.length === 0) {
      throw new ApiError(400, 'no_recipients', 'No users match the target criteria.');
    }

    await createNotificationsMany(
      users.map((u) => ({
        userId: u._id,
        title,
        body,
        type: 'SYSTEM' as const
      }))
    );

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
    const logs = await listBroadcastNotificationAuditLogs(20);

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
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

adminRouter.get('/products', validate({ query: productListQuerySchema }), async (req, res, next) => {
  try {
    const { status, category, featured, page, pageSize } = req.query as unknown as z.infer<typeof productListQuerySchema>;

    const where: {
      status?: ProductStatus;
      category?: string;
      discountPercent?: { gt: number };
    } = {};
    if (status) where.status = status.toLowerCase() === 'active' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
    if (category) where.category = category;
    if (featured === 'true') where.discountPercent = { gt: 0 };

    const { items: products, total } = await listAdminProductsPaged({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

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
        merchantName: p.merchant.shopName,
        createdAt: p.createdAt.toISOString(),
        featured: Boolean(p.discountPercent && p.discountPercent > 0)
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

    const product = await findAdminProductById(id);
    if (!product) throw new ApiError(404, 'product_not_found', 'Product not found.');

    const prismaStatus = status === 'active' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
    await updateAdminProductStatus(id, prismaStatus);

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

// ─── Social Groups ───────────────────────────────────────────────────────────

const groupListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  type: z.enum(['family', 'friends']).optional()
});

adminRouter.get('/groups', validate({ query: groupListQuerySchema }), async (req, res, next) => {
  try {
    const query = req.query as unknown as z.infer<typeof groupListQuerySchema>;
    const pg = paginationSchema.parse({ page: query.page, pageSize: query.pageSize });
    const { skip, take } = { skip: (pg.page - 1) * pg.pageSize, take: pg.pageSize };
    const { data, total } = await listAllSocialGroupsAdmin({
      skip,
      take,
      search: query.search,
      type: query.type
    });

    res.json(
      paginatedResponse(
        data.map((group) => ({
          ...group,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString()
        })),
        total,
        pg
      )
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/groups/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const detail = await getSocialGroupAdminDetail(id);
    if (!detail) {
      throw new ApiError(404, 'group_not_found', 'Group not found.');
    }

    res.json({
      data: {
        group: {
          ...detail.group,
          createdAt: detail.group.createdAt.toISOString(),
          updatedAt: detail.group.updatedAt.toISOString()
        },
        admin: detail.admin,
        members: detail.members.map((member) => ({
          ...member,
          createdAt: member.createdAt.toISOString()
        })),
        invites: detail.invites.map((invite) => ({
          ...invite,
          acceptedAt: invite.acceptedAt?.toISOString() ?? null,
          expiresAt: invite.expiresAt.toISOString(),
          createdAt: invite.createdAt.toISOString(),
          updatedAt: invite.updatedAt.toISOString()
        })),
        stats: detail.stats
      }
    });
  } catch (error) {
    next(error);
  }
});
