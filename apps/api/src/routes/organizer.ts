import { ActivityStatus, MembershipRole, NotificationType, RequestStatus, RewardAction, TenantType, UserRole } from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { mountActivityRoutes } from '../lib/activity-routes.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { randomToken } from '../lib/hash.js';
import { toLocationDto, buildActivityDto } from '../lib/mappers.js';
import { paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { hashPassword } from '../lib/password.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireMembershipRole, requireTenantContext } from '../middleware/tenant.js';
import { notifyRequestDecision, sendPasswordResetEmail } from '../lib/email.js';
import { validate } from '../middleware/validate.js';
import { awardPointsDefault } from '../services/rewards.js';
import { createUniqueReferralCode } from '../lib/referral-code.js';
import { performParticipantCheckInDefault } from '../services/checkin.js';
import { buildLocationCreateData } from '../services/location-submit.js';
import {
  assertLocationMatchesActivityType,
  sharedActivityTypeSchema
} from '../domain/activity-type.js';
import { locationSubmitBodySchema } from '../domain/location-submit.js';
import { createPasswordResetToken } from '../lib/auth-tokens.js';
import { createAuthUser, findAuthUserByEmail, updateAuthUserCore } from '../lib/auth-users.js';
import {
  cancelActivityById,
  createActivityDetailed,
  createLocationRecord,
  findTenantActivityBasic,
  findTenantById,
  findTenantCountryCode,
  findTenantActivityById,
  findTenantActivityForEdit,
  findTenantActivityWithParticipants,
  listSubmittedLocationsByUser,
  listTenantActivityHistoryWithParticipation,
  listTenantActivitiesDetailed,
  publishActivityById,
  updateActivityDetailed
} from '../lib/activities-store.js';
import {
  applyTenantActivityRequestDecision,
  clearActivityParticipantCheckIn,
  countTenantActivityRequests,
  findActivityParticipantByIdAndActivity,
  findTenantActivityRequestForDecision,
  listActivityParticipantsWithUsers,
  listTenantActivityRequestsDetailed
} from '../lib/activity-engagement-store.js';
import { createNotificationRecord, createNotificationsMany } from '../lib/notifications-store.js';
import {
  deleteTenantMembership,
  findCompanyGuideMembershipForUser,
  findTenantMembershipById,
  listTenantMembershipsWithUsers,
  setTenantMembershipActiveState,
  updateTenantMembershipRole,
  upsertTenantMembership
} from '../lib/tenant-access.js';

const idParamSchema = z.object({ id: z.string().min(1) });
const membershipIdSchema = z.object({ membershipId: z.string().min(1) });

const eventCreateSchema = z.object({
  activityType: sharedActivityTypeSchema,
  locationId: z.string().min(1),
  title: z.string().min(4).max(120),
  description: z.string().min(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  meetingPoint: z.string().max(200).optional(),
  meetingLat: z.number().min(-90).max(90).optional(),
  meetingLng: z.number().min(-180).max(180).optional(),
  startPoint: z.string().max(500).optional(),
  startLat: z.number().min(-90).max(90).optional(),
  startLng: z.number().min(-180).max(180).optional(),
  parkingPoint: z.string().max(200).optional(),
  parkingLat: z.number().min(-90).max(90).optional(),
  parkingLng: z.number().min(-180).max(180).optional(),
  meetingDifferent: z.boolean().optional(),
  carPoolEnabled: z.boolean().optional(),
  carPoolFree: z.boolean().optional(),
  carPoolPriceAed: z.number().int().min(0).optional(),
  carPoolSeats: z.number().int().min(1).optional(),
  carPoolDetails: z.string().max(1000).optional(),
  paymentTerms: z.string().max(1000).optional(),
  itinerary: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  price: z.number().int().min(0).default(0),
  pricePackages: tripPricePackagesSchema.optional(),
  capacity: z.number().int().positive(),
  images: z.array(z.string()).default([]),
  hostId: z.string().optional(),
  pricingMode: z.enum(['free', 'shared', 'paid']).optional()
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
  role: z.enum(['tenant_admin', 'tenant_guide']).optional(),
  isActive: z.boolean().optional()
});

import { parseLocalDateTime } from '../lib/datetime.js';
import {
  normalizeActivityPricing,
  parseStoredPricePackages,
  tripPricePackagesSchema
} from '../lib/trip-pricing.js';
import {
  notifyParticipantsOfScheduleChange,
  scheduleInstantChanged
} from '../services/activity-schedule.js';
import {
  assertActivityHost,
  assertActivityHostPatch,
  resolveActivityLocation
} from '../services/host-activity.js';
import { assertActivityPricingAllowed } from '../domain/activity-pricing.js';

const membershipRoleToPrisma = (role: 'tenant_admin' | 'tenant_guide'): MembershipRole =>
  role === 'tenant_admin' ? MembershipRole.TENANT_ADMIN : MembershipRole.TENANT_GUIDE;

export const organizerRouter = Router();
export const hostRouter = organizerRouter;

organizerRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

const tenantActivitiesRouter = Router();

tenantActivitiesRouter.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const { items: events, total } = await listTenantActivitiesDetailed({
      tenantId,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
      orderBy: { startAt: 'asc' }
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

tenantActivitiesRouter.post('/', validate({ body: eventCreateSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const platformAdmin = Boolean(req.tenantContext!.actingAsPlatformAdmin);
    const body = req.body as z.infer<typeof eventCreateSchema>;

    const location = await resolveActivityLocation(body.locationId, req.auth!.userId, { platformAdmin });
    assertLocationMatchesActivityType(location.activityType, body.activityType);

    const tenant = await findTenantById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'tenant_not_found', 'Host organization not found.');
    }

    const hostId = body.hostId ?? req.auth!.userId;
    await assertActivityHost(tenantId, hostId, tenant, { platformAdmin });

    const countryCode = tenant.countryCode ?? location.countryCode ?? 'AE';
    const pricing = normalizeActivityPricing({
      price: body.price,
      pricePackages: body.pricePackages,
      pricingMode: body.pricingMode,
    });
    assertActivityPricingAllowed(tenant.type, body.pricingMode, pricing);

    const created = await createActivityDetailed({
      tenant: { connect: { id: tenantId } },
      location: { connect: { id: body.locationId } },
      createdBy: { connect: { id: req.auth!.userId } },
      host: { connect: { id: hostId } },
      title: body.title,
      description: body.description,
      startAt: parseLocalDateTime(body.date, body.time, countryCode),
      endAt: body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined,
      meetingPoint: body.meetingPoint,
      meetingLat: body.meetingLat,
      meetingLng: body.meetingLng,
      startPoint: body.startPoint,
      startLat: body.startLat,
      startLng: body.startLng,
      parkingPoint: body.parkingPoint,
      parkingLat: body.parkingLat,
      parkingLng: body.parkingLng,
      meetingDifferent: body.meetingDifferent ?? false,
      carPoolEnabled: body.carPoolEnabled ?? false,
      carPoolFree: body.carPoolEnabled ? (body.carPoolFree ?? true) : null,
      carPoolPriceAed:
        body.carPoolEnabled && body.carPoolFree === false ? body.carPoolPriceAed ?? 0 : null,
      carPoolSeats: body.carPoolEnabled ? body.carPoolSeats ?? null : null,
      carPoolDetails: body.carPoolEnabled ? body.carPoolDetails : null,
      paymentTerms: body.paymentTerms,
      itinerary: body.itinerary,
      requirements: body.requirements,
      images: body.images,
      priceAed: pricing.priceAed,
      pricePackages: pricing.pricePackages,
      pricingMode: pricing.pricingMode,
      capacity: body.capacity
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.create',
      entityType: 'activity',
      entityId: created.id,
      tenantId
    });

    res.status(201).json({
      data: buildActivityDto(created)
    });
  } catch (error) {
    next(error);
  }
});

tenantActivitiesRouter.patch('/:id', validate({ params: idParamSchema, body: eventPatchSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const platformAdmin = Boolean(req.tenantContext!.actingAsPlatformAdmin);
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof eventPatchSchema>;

    const existing = await findTenantActivityForEdit(id, tenantId);
    if (!existing) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }
    if (existing.status === ActivityStatus.CANCELLED || existing.status === ActivityStatus.SUSPENDED) {
      throw new ApiError(400, 'activity_not_editable', `Cannot edit an activity that is ${existing.status.toLowerCase()}.`);
    }
    if (body.capacity !== undefined && body.capacity < existing.participants.length) {
      throw new ApiError(400, 'capacity_too_low', `Capacity cannot be less than current participants (${existing.participants.length}).`);
    }

    if (body.hostId) {
      await assertActivityHostPatch(tenantId, body.hostId, { platformAdmin });
    }

    if (body.locationId && body.activityType) {
      const location = await resolveActivityLocation(body.locationId, req.auth!.userId, { platformAdmin });
      assertLocationMatchesActivityType(location.activityType, body.activityType);
    } else if (body.locationId) {
      throw new ApiError(400, 'activity_type_required', 'Activity type is required when changing location.');
    } else if (body.activityType) {
      assertLocationMatchesActivityType(existing.location.activityType, body.activityType);
    }

    const tenantMeta = await findTenantCountryCode(tenantId);
    const countryCode = tenantMeta?.countryCode ?? 'AE';

    const nextStartAt =
      body.date && body.time ? parseLocalDateTime(body.date, body.time, countryCode) : undefined;
    const startChanged =
      nextStartAt !== undefined &&
      scheduleInstantChanged(existing.startAt, nextStartAt, countryCode);

    const pricing =
      body.price !== undefined || body.pricePackages !== undefined
        ? normalizeActivityPricing({
            price: body.price ?? existing.priceAed,
            pricePackages: body.pricePackages ?? parseStoredPricePackages(existing.pricePackages),
            pricingMode: body.pricingMode ?? existing.pricingMode ?? undefined,
          })
        : null;

    if (pricing) {
      const tenant = await findTenantById(tenantId);
      if (tenant) {
        assertActivityPricingAllowed(tenant.type, body.pricingMode, pricing);
      }
    }

    const updated = await updateActivityDetailed(id, {
      location: body.locationId ? { connect: { id: body.locationId } } : undefined,
      title: body.title,
      description: body.description,
      startAt: nextStartAt,
      endAt: body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined,
      meetingPoint: body.meetingPoint,
      meetingLat: body.meetingLat,
      meetingLng: body.meetingLng,
      startPoint: body.startPoint,
      startLat: body.startLat,
      startLng: body.startLng,
      parkingPoint: body.parkingPoint,
      parkingLat: body.parkingLat,
      parkingLng: body.parkingLng,
      meetingDifferent: body.meetingDifferent,
      carPoolEnabled: body.carPoolEnabled,
      carPoolFree: body.carPoolFree,
      carPoolPriceAed: body.carPoolPriceAed,
      carPoolSeats: body.carPoolSeats,
      carPoolDetails: body.carPoolDetails,
      paymentTerms: body.paymentTerms,
      itinerary: body.itinerary,
      requirements: body.requirements,
      images: body.images,
      ...(pricing
        ? {
            priceAed: pricing.priceAed,
            pricePackages: pricing.pricePackages,
            pricingMode: pricing.pricingMode,
          }
        : body.price !== undefined
          ? { priceAed: body.price }
          : {}),
      ...(body.pricingMode !== undefined ? { pricingMode: body.pricingMode } : {}),
      capacity: body.capacity,
      host: body.hostId ? { connect: { id: body.hostId } } : body.hostId === null ? { disconnect: true } : undefined
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.update',
      entityType: 'activity',
      entityId: id,
      tenantId
    });

    if (
      startChanged &&
      existing.status === ActivityStatus.PUBLISHED &&
      nextStartAt &&
      existing.participants.length > 0
    ) {
      await notifyParticipantsOfScheduleChange({
        activityId: existing.id,
        activityTitle: updated.title,
        participantUserIds: existing.participants.map((p) => p.userId),
        previousStartAt: existing.startAt,
        newStartAt: nextStartAt,
        countryCode
      });
    }

    res.json({
      data: buildActivityDto(updated)
    });
  } catch (error) {
    next(error);
  }
});

tenantActivitiesRouter.delete('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const event = await findTenantActivityWithParticipants(id, tenantId);
    if (!event) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }
    await cancelActivityById(event.id);

    // Notify all participants about the cancellation
    if (event.participants.length > 0) {
      await createNotificationsMany(
        event.participants.map((p) => ({
          userId: p.userId,
          title: 'Activity Cancelled',
          body: `The activity "${event.title}" has been cancelled by the organizer.`,
          type: NotificationType.ACTIVITY,
          meta: { activityId: event.id }
        }))
      );
    }

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.cancel',
      entityType: 'activity',
      entityId: event.id,
      tenantId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

tenantActivitiesRouter.post('/:id/publish', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const event = await findTenantActivityById(id, tenantId);
    if (!event) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }
    if (event.status !== ActivityStatus.DRAFT) {
      throw new ApiError(400, 'activity_not_draft', 'Only draft activities can be published.');
    }
    const updated = await publishActivityById(event.id);
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'activity.publish',
      entityType: 'activity',
      entityId: event.id,
      tenantId
    });
    const hostUserId = updated.hostId ?? updated.createdById;
    void awardPointsDefault({
      userId: hostUserId,
      action: RewardAction.ACTIVITY_PUBLISHED,
      referenceId: updated.id,
      label: `Published trip: ${updated.title}`
    }).catch(() => undefined);
    res.json({ message: 'Activity published.', activityId: updated.id });
  } catch (error) {
    next(error);
  }
});

organizerRouter.get('/requests', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const [requests, total] = await Promise.all([
      listTenantActivityRequestsDetailed({
        tenantId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countTenantActivityRequests(tenantId)
    ]);
    res.json(paginatedResponse(
      requests.map((request) => ({
        id: request.id,
        status: request.status.toLowerCase(),
        note: request.note,
        organizerNote: request.organizerNote,
        cancelReason: request.cancelReason,
        cancelMessage: request.cancelMessage,
        cancelledAt: request.cancelledAt,
        createdAt: request.createdAt,
        user: {
          id: request.user.id,
          email: request.user.email,
          displayName: request.user.profile?.displayName ?? request.user.email
        },
        event: {
          id: request.activity.id,
          title: request.activity.title,
          locationName: request.activity.location.name,
          startAt: request.activity.startAt
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

    const request = await findTenantActivityRequestForDecision(id, tenantId);

    if (!request) {
      throw new ApiError(404, 'request_not_found', 'Join request not found.');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new ApiError(400, 'request_finalized', 'Only pending requests can be processed.');
    }

    if (status === 'approved') {
      await applyTenantActivityRequestDecision({
        requestId: request.id,
        activityId: request.activityId,
        userId: request.userId,
        reviewerId: req.auth!.userId,
        decision: 'approved',
        organizerNote
      });

      await createNotificationRecord({
        userId: request.userId,
        title: 'Join request approved',
        body: 'Your request was approved. You are now confirmed for the event.',
        type: NotificationType.REQUEST_UPDATE,
        meta: { activityId: request.activityId, requestId: request.id }
      });
    } else {
      await applyTenantActivityRequestDecision({
        requestId: request.id,
        activityId: request.activityId,
        userId: request.userId,
        reviewerId: req.auth!.userId,
        decision: 'rejected',
        organizerNote
      });

      await createNotificationRecord({
        userId: request.userId,
        title: 'Join request rejected',
        body: organizerNote ?? 'Your request could not be approved at this time.',
        type: NotificationType.REQUEST_UPDATE,
        meta: { activityId: request.activityId, requestId: request.id }
      });
    }

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `request.${status}`,
      entityType: 'activity_request',
      entityId: request.id,
      tenantId
    });

    const userName = request.user.profile?.displayName ?? request.user.email.split('@')[0];
    const activityDate = request.activity.startAt.toISOString().slice(0, 10);
    notifyRequestDecision({
      to: request.user.email,
      userName,
      activityTitle: request.activity.title,
      activityDate,
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
    const members = await listTenantMembershipsWithUsers(tenantId);

    res.json({
      data: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        email: member.user.email,
        displayName: member.user.profile?.displayName ?? member.user.email,
        role: member.role.toLowerCase(),
        createdAt: member.createdAt,
        isActive: member.isActive ?? true
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

      const tenant = await findTenantById(tenantId);
      if (!tenant) {
        throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
      }

      let user = await findAuthUserByEmail(body.email);
      let isNewUser = false;
      if (!user) {
        const tempPassword = `Temp#${randomToken(6)}`;
        const referralCode = await createUniqueReferralCode();
        user = await createAuthUser({
          email: body.email,
          passwordHash: await hashPassword(tempPassword),
          referralCode,
          role: role === MembershipRole.TENANT_ADMIN ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE,
          status: 'ACTIVE',
          authProvider: 'EMAIL',
          emailVerifiedAt: null,
          lastActiveAt: null,
          googleId: null,
          profile: {
            displayName: body.displayName ?? body.email.split('@')[0],
            phone: null,
            bio: null,
            avatarUrl: null
          }
        });
        isNewUser = true;
      }

      if (role === MembershipRole.TENANT_GUIDE && tenant.type === TenantType.COMPANY) {
        const existingCompanyGuideMembership = await findCompanyGuideMembershipForUser(user._id, tenantId);
        if (existingCompanyGuideMembership) {
          throw new ApiError(400, 'guide_tenant_conflict', 'Guide is already assigned to another company tenant.');
        }
      }

      const membership = await upsertTenantMembership({ tenantId, userId: user._id, role });

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'team.upsert_member',
        entityType: 'tenant_membership',
        entityId: membership.id,
        tenantId
      });

      // For new users, create a password reset token and email the invite link
      if (isNewUser) {
        const resetToken = randomToken(24);
        await createPasswordResetToken({
          userId: user._id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        await sendPasswordResetEmail({
          to: user.email,
          name: user.profile.displayName ?? user.email,
          token: resetToken
        });
      }

      res.status(201).json({
        data: {
          id: membership.id,
          userId: user._id,
          email: user.email,
          displayName: user.profile.displayName ?? user.email,
          role: membership.role.toLowerCase(),
          isNewUser
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
      const { role, isActive } = req.body as z.infer<typeof teamPatchSchema>;
      const tenantId = req.tenantContext!.tenantId;

      const membership = await findTenantMembershipById(tenantId, membershipId);
      if (!membership) {
        throw new ApiError(404, 'membership_not_found', 'Team member not found.');
      }

      let updated: { id: string; role: MembershipRole; isActive: boolean } | null = null;
      if (role) {
        const updatedRoleMembership = await updateTenantMembershipRole(membership.id, membershipRoleToPrisma(role));
        updated = {
          id: updatedRoleMembership.id,
          role: updatedRoleMembership.role,
          isActive: (updatedRoleMembership as { isActive?: boolean }).isActive ?? true
        };
        await updateAuthUserCore({
          userId: membership.userId,
          role: role === 'tenant_admin' ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE
        });
      }

      if (isActive !== undefined) {
        updated = await setTenantMembershipActiveState(membership.id, isActive);
      }

      await createAuditLog({
        actorId: req.auth!.userId,
        action: isActive !== undefined ? 'team.update_status' : 'team.update_role',
        entityType: 'tenant_membership',
        entityId: membership.id,
        tenantId
      });

      res.json({
        data: {
          id: membership.id,
          role: updated?.role?.toLowerCase() ?? membership.role.toLowerCase(),
          isActive: updated?.isActive ?? (membership as { isActive?: boolean }).isActive ?? true
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

organizerRouter.delete(
  '/team/:membershipId',
  requireMembershipRole([MembershipRole.TENANT_OWNER, MembershipRole.TENANT_ADMIN]),
  validate({ params: membershipIdSchema }),
  async (req, res, next) => {
    try {
      const { membershipId } = req.params as z.infer<typeof membershipIdSchema>;
      const tenantId = req.tenantContext!.tenantId;

      const membership = await findTenantMembershipById(tenantId, membershipId);
      if (!membership) {
        throw new ApiError(404, 'membership_not_found', 'Team member not found.');
      }

      if (membership.role === MembershipRole.TENANT_OWNER) {
        throw new ApiError(400, 'owner_cannot_be_removed', 'The tenant owner cannot be removed.');
      }

      const removed = await deleteTenantMembership(membership.id);
      if (!removed) {
        throw new ApiError(500, 'membership_delete_failed', 'Failed to remove team member.');
      }

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'team.remove_member',
        entityType: 'tenant_membership',
        entityId: membership.id,
        tenantId
      });

      res.json({ data: { removed: true } });
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

tenantActivitiesRouter.get('/:id/participants', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params as z.infer<typeof idParamSchema>;

    const activity = await findTenantActivityBasic(id, tenantId);
    if (!activity) throw new ApiError(404, 'activity_not_found', 'Activity not found.');

    const participants = await listActivityParticipantsWithUsers(id);

    res.json({
      data: {
        activityId: id,
        activityTitle: activity.title,
        capacity: activity.capacity,
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

tenantActivitiesRouter.post('/:id/participants/:participantId/checkin', validate({ params: participantIdSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

    const result = await performParticipantCheckInDefault({
      activityId: id,
      participantId,
      actorUserId: req.auth!.userId,
      source: 'organizer',
      tenantId
    });

    res.json({
      message: result.alreadyCheckedIn ? 'Participant already checked in.' : 'Participant checked in.',
      checkedInAt: result.checkedInAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

tenantActivitiesRouter.delete('/:id/participants/:participantId/checkin', validate({ params: participantIdSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

    const activity = await findTenantActivityById(id, tenantId);
    if (!activity) throw new ApiError(404, 'activity_not_found', 'Activity not found.');

    const participant = await findActivityParticipantByIdAndActivity(participantId, id);
    if (!participant) throw new ApiError(404, 'participant_not_found', 'Participant not found.');

    await clearActivityParticipantCheckIn(participantId);

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'participant.undo_checkin',
      entityType: 'activity_participant',
      entityId: participantId,
      tenantId
    });

    res.json({ message: 'Check-in undone.' });
  } catch (error) {
    next(error);
  }
});

// ─── Location Submission ────────────────────────────────────────────────────

organizerRouter.get('/locations', async (req, res, next) => {
  try {
    const locations = await listSubmittedLocationsByUser(req.auth!.userId);
    res.json({ data: locations.map((l) => toLocationDto(l)) });
  } catch (error) {
    next(error);
  }
});

organizerRouter.post('/locations', validate({ body: locationSubmitBodySchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof locationSubmitBodySchema>;

    const created = await createLocationRecord(buildLocationCreateData(body, req.auth!.userId));

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'location.submit',
      entityType: 'location',
      entityId: created.id,
      tenantId: req.tenantContext!.tenantId
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

// ─── Activity History ──────────────────────────────────────────────────────────

tenantActivitiesRouter.get('/history', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const { items: events, total } = await listTenantActivityHistoryWithParticipation({
      tenantId,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize
    });

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

mountActivityRoutes(organizerRouter, tenantActivitiesRouter);
