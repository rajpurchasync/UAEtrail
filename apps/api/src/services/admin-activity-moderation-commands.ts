import { ActivityStatus } from '../domain/enums.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import {
  findAdminEventById,
  toggleAdminEventFeatured,
  updateAdminActivityStatus,
} from '../lib/admin-store.js';
import { HOST_ACTIVITIES_PATH } from '../lib/member-routes.js';
import { notifyUserAdminAction } from './admin-notifications.js';

export const moderateAdminActivity = async (input: {
  actorId: string;
  activityId: string;
  action: 'suspend' | 'unsuspend';
  comment?: string;
}) => {
  const event = await findAdminEventById(input.activityId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const status = input.action === 'suspend' ? ActivityStatus.SUSPENDED : ActivityStatus.PUBLISHED;
  await updateAdminActivityStatus(event.id, status);

  await createAuditLog({
    actorId: input.actorId,
    action: `event.${input.action}`,
    entityType: 'activity',
    entityId: event.id,
    tenantId: event.tenantId,
    metadata: input.comment ? { comment: input.comment } : undefined,
  });

  if (input.action === 'suspend' && event.createdById) {
    await notifyUserAdminAction({
      userId: event.createdById,
      title: 'Activity suspended',
      body: input.comment
        ? `Your activity "${event.title}" has been suspended. Reason: ${input.comment}`
        : `Your activity "${event.title}" has been suspended by an administrator.`,
      reason: input.comment,
      meta: { kind: 'activity_suspended', activityId: event.id, path: HOST_ACTIVITIES_PATH },
    });
  }

  return { message: `Activity ${input.action}ed successfully.` };
};

export const toggleAdminActivityFeatured = async (input: { actorId: string; activityId: string }) => {
  const event = await findAdminEventById(input.activityId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const updated = await toggleAdminEventFeatured(event.id, !event.featured);

  await createAuditLog({
    actorId: input.actorId,
    action: updated.featured ? 'activity.feature' : 'activity.unfeature',
    entityType: 'activity',
    entityId: event.id,
    tenantId: event.tenantId,
  });

  return {
    message: `Activity ${updated.featured ? 'featured' : 'unfeatured'} successfully.`,
    featured: updated.featured,
  };
};
