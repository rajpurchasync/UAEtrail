import { ActivityType, EventStatus, LocationStatus, MembershipRole, NotificationType, RequestStatus, RewardAction, TenantType, UserRole } from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { randomToken, hashToken } from '../lib/hash.js';
import { toLocationDto, buildEventDto } from '../lib/mappers.js';
import { paginate, paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { hashPassword } from '../lib/password.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireMembershipRole, requireTenantContext } from '../middleware/tenant.js';
import { notifyRequestDecision, sendPasswordResetEmail } from '../lib/email.js';
import { validate } from '../middleware/validate.js';
import { awardPointsDefault } from '../services/rewards.js';
import { createUniqueReferralCode } from '../lib/referral-code.js';
import { performParticipantCheckInDefault } from '../services/checkin.js';
import { buildLocationCreateData } from '../services/location-submit.js';
import { locationSubmitBodySchema } from '../domain/location-submit.js';
import { createPasswordResetToken } from '../lib/auth-tokens.js';
import { createAuthUser, findAuthUserByEmail, updateAuthUserCore } from '../lib/auth-users.js';
import {
  cancelEventById,
  createEventDetailed,
  createLocationRecord,
  findTenantEventBasic,
  findLocationById,
  findTenantById,
  findTenantCountryCode,
  findTenantEventById,
  findTenantEventForEdit,
  findTenantEventWithParticipants,
  findTenantMembershipByUser,
  listSubmittedLocationsByUser,
  listTenantEventHistoryWithParticipation,
  listTenantEventsDetailed,
  publishEventById,
  updateEventDetailed
} from '../lib/events-store.js';
import {
  applyTenantEventRequestDecision,
  clearEventParticipantCheckIn,
  countTenantEventRequests,
  findEventParticipantByIdAndEvent,
  findTenantEventRequestForDecision,
  listEventParticipantsWithUsers,
  listTenantEventRequestsDetailed
} from '../lib/event-engagement-store.js';
import { createNotificationRecord, createNotificationsMany } from '../lib/notifications-store.js';
import {
  findCompanyGuideMembershipForUser,
  findTenantMembershipById,
  listTenantMembershipsWithUsers,
  updateTenantMembershipRole,
  upsertTenantMembership
} from '../lib/tenant-access.js';

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
  meetingLat: z.number().min(-90).max(90).optional(),
  meetingLng: z.number().min(-180).max(180).optional(),
  parkingPoint: z.string().max(200).optional(),
  parkingLat: z.number().min(-90).max(90).optional(),
  parkingLng: z.number().min(-180).max(180).optional(),
  meetingDifferent: z.boolean().optional(),
  carPoolEnabled: z.boolean().optional(),
  carPoolFree: z.boolean().optional(),
  carPoolPriceAed: z.number().int().min(0).optional(),
  carPoolDetails: z.string().max(1000).optional(),
  paymentTerms: z.string().max(1000).optional(),
  itinerary: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  price: z.number().int().min(0).default(0),
  pricePackages: tripPricePackagesSchema.optional(),
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
import {
  eventHasPaidPricing,
  normalizeEventPricing,
  parseStoredPricePackages,
  tripPricePackagesSchema
} from '../lib/trip-pricing.js';
import {
  notifyParticipantsOfScheduleChangeDefault,
  scheduleInstantChanged
} from '../services/event-schedule.js';

const membershipRoleToPrisma = (role: 'tenant_admin' | 'tenant_guide'): MembershipRole =>
  role === 'tenant_admin' ? MembershipRole.TENANT_ADMIN : MembershipRole.TENANT_GUIDE;

const assertEventLocation = async (locationId: string, userId: string) => {
  const location = await findLocationById(locationId);
  if (!location) {
    throw new ApiError(400, 'invalid_location', 'Location not found.');
  }
  const ownDraft =
    location.status === LocationStatus.DRAFT && location.submittedById === userId;
  if (location.status !== LocationStatus.ACTIVE && !ownDraft) {
    throw new ApiError(
      400,
      'invalid_location',
      'Location must be active, or a draft you submitted while it is under review.'
    );
  }
  return location;
};

export const organizerRouter = Router();

organizerRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

organizerRouter.get('/events', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const { items: events, total } = await listTenantEventsDetailed({
      tenantId,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
      orderBy: { startAt: 'asc' }
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

organizerRouter.post('/events', validate({ body: eventCreateSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const body = req.body as z.infer<typeof eventCreateSchema>;

    const location = body.locationId
      ? await assertEventLocation(body.locationId, req.auth!.userId)
      : null;
    if (!location) {
      throw new ApiError(400, 'invalid_location', 'Location is required.');
    }

    const tenant = await findTenantById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'tenant_not_found', 'Organization not found.');
    }

    const hostId = body.guideId ?? req.auth!.userId;
    if (tenant.type === TenantType.COMPANY && !body.guideId) {
      throw new ApiError(400, 'host_required', 'Select a host who will run this event.');
    }

    const hostMembership = await findTenantMembershipByUser(tenantId, hostId);
    if (!hostMembership) {
      throw new ApiError(400, 'invalid_host', 'Host must be a member of this organization.');
    }

    const countryCode = tenant.countryCode ?? location.countryCode ?? 'AE';
    const pricing = normalizeEventPricing({
      price: body.price,
      pricePackages: body.pricePackages
    });

    const created = await createEventDetailed({
      tenant: { connect: { id: tenantId } },
      location: { connect: { id: body.locationId } },
      createdBy: { connect: { id: req.auth!.userId } },
      guide: { connect: { id: hostId } },
      title: body.title,
      description: body.description,
      startAt: parseLocalDateTime(body.date, body.time, countryCode),
      endAt: body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined,
      meetingPoint: body.meetingPoint,
      meetingLat: body.meetingLat,
      meetingLng: body.meetingLng,
      parkingPoint: body.parkingPoint,
      parkingLat: body.parkingLat,
      parkingLng: body.parkingLng,
      meetingDifferent: body.meetingDifferent ?? false,
      carPoolEnabled: body.carPoolEnabled ?? false,
      carPoolFree: body.carPoolEnabled ? (body.carPoolFree ?? true) : null,
      carPoolPriceAed:
        body.carPoolEnabled && body.carPoolFree === false ? body.carPoolPriceAed ?? 0 : null,
      carPoolDetails: body.carPoolEnabled ? body.carPoolDetails : null,
      paymentTerms: body.paymentTerms,
      itinerary: body.itinerary,
      requirements: body.requirements,
      images: body.images,
      priceAed: pricing.priceAed,
      pricePackages: pricing.pricePackages,
      capacity: body.capacity
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

    const existing = await findTenantEventForEdit(id, tenantId);
    if (!existing) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }
    if (existing.status === EventStatus.CANCELLED || existing.status === EventStatus.SUSPENDED) {
      throw new ApiError(400, 'event_not_editable', `Cannot edit an event that is ${existing.status.toLowerCase()}.`);
    }
    if (body.capacity !== undefined && body.capacity < existing.participants.length) {
      throw new ApiError(400, 'capacity_too_low', `Capacity cannot be less than current participants (${existing.participants.length}).`);
    }

    if (body.guideId !== undefined) {
      const tenant = await findTenantById(tenantId);
      if (tenant?.type === TenantType.COMPANY && !body.guideId) {
        throw new ApiError(400, 'host_required', 'Select a host who will run this event.');
      }
      if (body.guideId) {
        const hostMembership = await findTenantMembershipByUser(tenantId, body.guideId);
        if (!hostMembership) {
          throw new ApiError(400, 'invalid_host', 'Host must be a member of this organization.');
        }
      }
    }

    if (body.locationId) {
      await assertEventLocation(body.locationId, req.auth!.userId);
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
        ? normalizeEventPricing({
            price: body.price ?? existing.priceAed,
            pricePackages: body.pricePackages ?? parseStoredPricePackages(existing.pricePackages)
          })
        : null;

    const updated = await updateEventDetailed(id, {
      location: body.locationId ? { connect: { id: body.locationId } } : undefined,
      title: body.title,
      description: body.description,
      startAt: nextStartAt,
      endAt: body.endDate && body.endTime ? parseLocalDateTime(body.endDate, body.endTime, countryCode) : undefined,
      meetingPoint: body.meetingPoint,
      meetingLat: body.meetingLat,
      meetingLng: body.meetingLng,
      parkingPoint: body.parkingPoint,
      parkingLat: body.parkingLat,
      parkingLng: body.parkingLng,
      meetingDifferent: body.meetingDifferent,
      carPoolEnabled: body.carPoolEnabled,
      carPoolFree: body.carPoolFree,
      carPoolPriceAed: body.carPoolPriceAed,
      carPoolDetails: body.carPoolDetails,
      paymentTerms: body.paymentTerms,
      itinerary: body.itinerary,
      requirements: body.requirements,
      images: body.images,
      ...(pricing
        ? { priceAed: pricing.priceAed, pricePackages: pricing.pricePackages }
        : body.price !== undefined
          ? { priceAed: body.price }
          : {}),
      capacity: body.capacity,
      guide: body.guideId ? { connect: { id: body.guideId } } : body.guideId === null ? { disconnect: true } : undefined
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'event.update',
      entityType: 'event',
      entityId: id,
      tenantId
    });

    if (
      startChanged &&
      existing.status === EventStatus.PUBLISHED &&
      nextStartAt &&
      existing.participants.length > 0
    ) {
      await notifyParticipantsOfScheduleChangeDefault({
        eventId: existing.id,
        eventTitle: updated.title,
        participantUserIds: existing.participants.map((p) => p.userId),
        previousStartAt: existing.startAt,
        newStartAt: nextStartAt,
        countryCode
      });
    }

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
    const event = await findTenantEventWithParticipants(id, tenantId);
    if (!event) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }
    await cancelEventById(event.id);

    // Notify all participants about the cancellation
    if (event.participants.length > 0) {
      await createNotificationsMany(
        event.participants.map((p) => ({
          userId: p.userId,
          title: 'Event Cancelled',
          body: `The event "${event.title}" has been cancelled by the organizer.`,
          type: NotificationType.EVENT,
          meta: { eventId: event.id }
        }))
      );
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
    const event = await findTenantEventById(id, tenantId);
    if (!event) {
      throw new ApiError(404, 'event_not_found', 'Event not found.');
    }
    if (event.status !== EventStatus.DRAFT) {
      throw new ApiError(400, 'event_not_draft', 'Only draft events can be published.');
    }
    const updated = await publishEventById(event.id);
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'event.publish',
      entityType: 'event',
      entityId: event.id,
      tenantId
    });
    const hostUserId = updated.guideId ?? updated.createdById;
    void awardPointsDefault({
      userId: hostUserId,
      action: RewardAction.EVENT_PUBLISHED,
      referenceId: updated.id,
      label: `Published trip: ${updated.title}`
    }).catch(() => undefined);
    res.json({ message: 'Event published.', eventId: updated.id });
  } catch (error) {
    next(error);
  }
});

organizerRouter.get('/requests', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const [requests, total] = await Promise.all([
      listTenantEventRequestsDetailed({
        tenantId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countTenantEventRequests(tenantId)
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

    const request = await findTenantEventRequestForDecision(id, tenantId);

    if (!request) {
      throw new ApiError(404, 'request_not_found', 'Join request not found.');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new ApiError(400, 'request_finalized', 'Only pending requests can be processed.');
    }

    if (status === 'approved') {
      await applyTenantEventRequestDecision({
        requestId: request.id,
        eventId: request.eventId,
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
        meta: { eventId: request.eventId, requestId: request.id }
      });
    } else {
      await applyTenantEventRequestDecision({
        requestId: request.id,
        eventId: request.eventId,
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
        meta: { eventId: request.eventId, requestId: request.id }
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
    const members = await listTenantMembershipsWithUsers(tenantId);

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
      const { role } = req.body as z.infer<typeof teamPatchSchema>;
      const tenantId = req.tenantContext!.tenantId;

      const membership = await findTenantMembershipById(tenantId, membershipId);
      if (!membership) {
        throw new ApiError(404, 'membership_not_found', 'Team member not found.');
      }

      const updated = await updateTenantMembershipRole(membership.id, membershipRoleToPrisma(role));

      await updateAuthUserCore({
        userId: membership.userId,
        role: role === 'tenant_admin' ? UserRole.TENANT_ADMIN : UserRole.TENANT_GUIDE
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

    const event = await findTenantEventBasic(id, tenantId);
    if (!event) throw new ApiError(404, 'event_not_found', 'Event not found.');

    const participants = await listEventParticipantsWithUsers(id);

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

    const result = await performParticipantCheckInDefault({
      eventId: id,
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

organizerRouter.delete('/events/:id/participants/:participantId/checkin', validate({ params: participantIdSchema }), async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id, participantId } = req.params as z.infer<typeof participantIdSchema>;

    const event = await findTenantEventById(id, tenantId);
    if (!event) throw new ApiError(404, 'event_not_found', 'Event not found.');

    const participant = await findEventParticipantByIdAndEvent(participantId, id);
    if (!participant) throw new ApiError(404, 'participant_not_found', 'Participant not found.');

    await clearEventParticipantCheckIn(participantId);

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

// ─── Event History ──────────────────────────────────────────────────────────

organizerRouter.get('/events/history', async (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const pg = paginationSchema.parse(req.query);
    const { items: events, total } = await listTenantEventHistoryWithParticipation({
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
