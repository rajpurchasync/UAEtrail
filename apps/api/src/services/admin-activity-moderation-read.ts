import { ApiError } from '../lib/api-error.js';
import {
  findAdminActivityDetailedById,
  findAdminEventById,
  listAdminModerationEventsPaged,
} from '../lib/admin-store.js';
import {
  listActivityParticipantsWithUsers,
  listActivityRequestsForActivity,
} from '../lib/activity-engagement-store.js';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import { buildActivityDto } from '../lib/mappers.js';
import { findActivityPrivateById, findActivityPrivateByIds } from '../lib/activity-private-store.js';

export const listAdminActivityModerationPage = async (input: { page: number; pageSize: number }) => {
  const { items: events, total } = await listAdminModerationEventsPaged({
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });
  const privateById = await findActivityPrivateByIds(events.map((e) => e.id));
  return {
    total,
    items: events.map((event) => buildActivityDto(event, { activityPrivate: privateById.get(event.id) ?? null })),
  };
};

export const loadAdminActivityModerationDetail = async (activityId: string) => {
  const event = await findAdminActivityDetailedById(activityId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  const priv = await findActivityPrivateById(activityId);
  return buildActivityDto(event, { activityPrivate: priv });
};

export const loadAdminActivityEngagement = async (activityId: string) => {
  const event = await findAdminEventById(activityId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const [participants, requests] = await Promise.all([
    listActivityParticipantsWithUsers(activityId),
    listActivityRequestsForActivity(activityId),
  ]);

  const requestUserIds = [...new Set(requests.map((r) => r.userId))];
  const requestUsers = requestUserIds.length > 0 ? await findAuthUsersByIds(requestUserIds) : [];
  const requestUserMap = new Map(requestUsers.map((u) => [u._id, u]));

  return {
    participants: participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      checkedInAt: p.checkedInAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      displayName: p.user.profile?.displayName ?? null,
      email: p.user.email,
    })),
    joinRequests: requests.map((r) => {
      const user = requestUserMap.get(r.userId);
      return {
        id: r.id,
        userId: r.userId,
        status: r.status.toLowerCase(),
        note: r.note ?? null,
        createdAt: r.createdAt.toISOString(),
        displayName: user?.profile.displayName ?? null,
        email: user?.email ?? '',
      };
    }),
  };
};
