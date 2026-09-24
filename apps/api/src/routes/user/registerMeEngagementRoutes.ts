import type { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { RequestStatus, TenantBusinessMode, TenantType, UserRole } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import {
  findActivityForRequestViewById,
  listActivitiesForRequestViews,
  listActiveTenantMembershipsByUser,
} from '../../lib/activities-store.js';
import {
  countUserActivityParticipants,
  countUserActivityRequests,
  findActivityRequestByIdForUser,
  listUserActivityParticipantsPaginated,
  listUserActivityRequestsPaginated,
} from '../../lib/activity-engagement-store.js';
import { registerActivityRoute } from '../../lib/activity-routes.js';
import { findAuthUserById, listAuthUsers } from '../../lib/auth-users.js';
import { findLatestHostApplicationByApplicant } from '../../lib/host-applications-store.js';
import { buildActivityDto } from '../../lib/mappers.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { removePushSubscription, upsertPushSubscription } from '../../lib/push-subscriptions.js';
import {
  listTenantsByOwnerId,
  mergeActiveTenantsForHostStatus,
  pickActivityTenant,
  resolveOwnedProfileType,
} from '../../lib/tenant-store.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { buildParticipationDto } from '../../services/checkin.js';
import { ensureActivityGroupChat, userCanAccessActivityGroupChat } from '../../services/activity-group-chat.js';
import { eventIdParamSchema, pushSubscriptionSchema, userSearchSchema } from './schemas.js';

const meRequestIdParamSchema = z.object({ requestId: z.string().min(1) });

const mapMeRequest = (
  request: {
    id: string;
    status: RequestStatus;
    note: string | null;
    organizerNote: string | null;
    cancelReason: string | null;
    cancelMessage: string | null;
    cancelledAt: Date | null;
    createdAt: Date;
  },
  event: Parameters<typeof buildActivityDto>[0]
) => {
  const activity = buildActivityDto(event);
  return {
    id: request.id,
    status: request.status.toLowerCase(),
    note: request.note,
    organizerNote: request.organizerNote,
    cancelReason: request.cancelReason,
    cancelMessage: request.cancelMessage,
    cancelledAt: request.cancelledAt?.toISOString() ?? null,
    createdAt: request.createdAt,
    activity: {
      id: activity.id,
      title: activity.title,
      locationName: activity.locationName,
      date: activity.date,
      time: activity.time,
      hostName: activity.hostName,
      hostUserId: activity.hostUserId,
      tenantName: activity.tenantName,
      tenantSlug: activity.tenantSlug,
    },
  };
};

const listMyActivitiesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const [participantEntries, total] = await Promise.all([
      listUserActivityParticipantsPaginated({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countUserActivityParticipants(req.auth!.userId)
    ]);

    const eventIds = [...new Set(participantEntries.map((entry) => entry.activityId))];
    const events = eventIds.length > 0 ? await listActivitiesForRequestViews(eventIds) : [];
    const eventMap = new Map(events.map((event) => [event.id, event]));

    const activityViews = participantEntries.reduce<Array<ReturnType<typeof buildActivityDto> & { participation: ReturnType<typeof buildParticipationDto> }>>((acc, entry) => {
      const event = eventMap.get(entry.activityId);
      if (!event) return acc;
      acc.push({
        ...buildActivityDto(event),
        participation: buildParticipationDto(event, entry)
      });
      return acc;
    }, []);

    res.json(paginatedResponse(
      activityViews,
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
};

/** Authenticated activity participation hub (requires prior auth middleware). */
export const registerMeActivityParticipationRoutes = (router: Router): void => {
registerActivityRoute(
  router,
  'get',
  '/:id/group-chat',
  validate({ params: eventIdParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const allowed = await userCanAccessActivityGroupChat({
        activityId: id,
        userId: req.auth!.userId
      });
      if (!allowed) {
        throw new ApiError(403, 'forbidden', 'You cannot access this activity chat.');
      }

      const groupId = await ensureActivityGroupChat(id);
      if (!groupId) {
        throw new ApiError(404, 'group_chat_unavailable', 'Activity chat is not available.');
      }

      res.json({ data: { groupId } });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me/requests/:requestId', validate({ params: meRequestIdParamSchema }), async (req, res, next) => {
  try {
    const { requestId } = req.params as z.infer<typeof meRequestIdParamSchema>;
    const request = await findActivityRequestByIdForUser(requestId, req.auth!.userId);
    if (!request) {
      throw new ApiError(404, 'request_not_found', 'Request not found.');
    }

    const activity = await findActivityForRequestViewById(request.activityId);
    if (!activity) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }

    res.json({
      data: mapMeRequest(request, activity)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me/requests', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const [requests, total] = await Promise.all([
      listUserActivityRequestsPaginated({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      countUserActivityRequests(req.auth!.userId)
    ]);

    const activityIds = [...new Set(requests.map((request) => request.activityId))];
    const activities = activityIds.length > 0 ? await listActivitiesForRequestViews(activityIds) : [];
    const activityMap = new Map(activities.map((activity) => [activity.id, activity]));

    const requestViews = requests.reduce<Array<ReturnType<typeof mapMeRequest>>>((acc, request) => {
      const activity = activityMap.get(request.activityId);
      if (!activity) return acc;
      acc.push(mapMeRequest(request, activity));
      return acc;
    }, []);

    res.json(paginatedResponse(
      requestViews,
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

router.get('/me/activities', listMyActivitiesHandler);
};

/** Push, host gate, tenant memberships, user search (requires prior auth middleware). */
export const registerMeAccountSessionRoutes = (router: Router): void => {
router.post('/me/push-subscriptions', validate({ body: pushSubscriptionSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof pushSubscriptionSchema>;
    const sub = await upsertPushSubscription({
      userId: req.auth!.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth
    });
    res.status(201).json({ data: { id: sub.id } });
  } catch (error) {
    next(error);
  }
});

router.delete('/me/push-subscriptions', validate({ body: z.object({ endpoint: z.string().url() }) }), async (req, res, next) => {
  try {
    const { endpoint } = req.body as { endpoint: string };
    await removePushSubscription({ userId: req.auth!.userId, endpoint });
    res.json({ message: 'Push subscription removed.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me/tenants', async (req, res, next) => {
  try {
    const memberships = await listActiveTenantMembershipsByUser(req.auth!.userId);

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

router.get('/me/host-status', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const user = await findAuthUserById(userId);
    const role = user?.role ?? UserRole.PARTICIPANT;
    const isHostRole =
      role === UserRole.TENANT_OWNER ||
      role === UserRole.TENANT_ADMIN ||
      role === UserRole.TENANT_GUIDE;
    const isPlatformAdmin = role === UserRole.PLATFORM_ADMIN;

    const [ownedByOwnerId, memberships] = await Promise.all([
      listTenantsByOwnerId(userId),
      listActiveTenantMembershipsByUser(userId),
    ]);
    const ownedTenants = mergeActiveTenantsForHostStatus(ownedByOwnerId, memberships);
    const ownedProfiles = ownedTenants.map((tenant) => ({
      type: resolveOwnedProfileType(tenant),
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    }));

    const hasGuideProfile = ownedProfiles.some((profile) => profile.type === 'guide');
    const hasAgencyProfile = ownedProfiles.some((profile) => profile.type === 'agency');
    const hasShopProfile = ownedProfiles.some((profile) => profile.type === 'shop');

    const activityTenant = pickActivityTenant(ownedTenants);
    const tenantId = activityTenant?.id ?? null;

    const application = await findLatestHostApplicationByApplicant(userId);
    let applicationStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
    if (application) {
      const normalized = application.status.toLowerCase();
      if (normalized === 'pending' || normalized === 'approved' || normalized === 'rejected') {
        applicationStatus = normalized;
      }
    }

    const canPublish =
      isPlatformAdmin || ((isHostRole || ownedTenants.length > 0) && (hasGuideProfile || hasAgencyProfile));

    let tenantType: 'company' | 'guide_owned' | null = null;
    let businessMode: 'agency' | 'shop' | null = null;
    if (activityTenant) {
      tenantType = activityTenant.type === TenantType.COMPANY ? 'company' : 'guide_owned';
      businessMode =
        activityTenant.businessMode === TenantBusinessMode.AGENCY
          ? 'agency'
          : activityTenant.businessMode === TenantBusinessMode.SHOP
            ? 'shop'
            : null;
    }

    const canHostPaidActivities = isPlatformAdmin || hasAgencyProfile;

    res.json({
      data: {
        canPublish,
        applicationStatus,
        tenantId,
        isHostRole,
        hasTenant: ownedTenants.length > 0,
        tenantType,
        businessMode,
        canHostPaidActivities,
        hasGuideProfile,
        hasAgencyProfile,
        hasShopProfile,
        ownedProfiles
      }
    });
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ User Search (for starting new conversations) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/users/search', validate({ query: userSearchSchema }), async (req, res, next) => {
  try {
    const { q } = req.query as z.infer<typeof userSearchSchema>;
    const currentUserId = req.auth!.userId;

    const users = (await listAuthUsers({ status: 'ACTIVE', search: q, take: 20 })).filter((u) => u._id !== currentUserId).slice(0, 10);

    res.json({
      data: users.map((u) => ({
        id: u._id,
        displayName: u.profile.displayName ?? null,
        avatarUrl: u.profile.avatarUrl ?? null
      }))
    });
  } catch (error) {
    next(error);
  }
});
};
