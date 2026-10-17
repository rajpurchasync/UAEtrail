import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { GROUPS_PATH } from '../lib/member-routes.js';
import { getSocialGroupAdminDetail, updateGroupStatus } from '../lib/social-groups-store.js';
import { notifyUserAdminAction } from './admin-notifications.js';

export const setAdminSocialGroupStatus = async (input: {
  actorId: string;
  groupId: string;
  status: 'active' | 'suspended';
  comment?: string;
}) => {
  const detail = await getSocialGroupAdminDetail(input.groupId);
  if (!detail) {
    throw new ApiError(404, 'group_not_found', 'Group not found.');
  }

  const updated = await updateGroupStatus(input.groupId, input.status);
  if (!updated) {
    throw new ApiError(404, 'group_not_found', 'Group not found.');
  }

  await createAuditLog({
    actorId: input.actorId,
    action: `group.${input.status === 'active' ? 'activate' : 'suspend'}`,
    entityType: 'group',
    entityId: input.groupId,
    metadata: input.comment ? { comment: input.comment } : undefined,
  });

  if (detail.admin) {
    await notifyUserAdminAction({
      userId: detail.admin.id,
      title: input.status === 'active' ? 'Group reactivated' : 'Group suspended',
      body:
        input.status === 'active'
          ? `Your group "${detail.group.name}" is active again.`
          : input.comment
            ? `Your group "${detail.group.name}" has been suspended. Reason: ${input.comment}`
            : `Your group "${detail.group.name}" has been suspended by an administrator.`,
      reason: input.comment,
      meta: {
        kind: input.status === 'active' ? 'group_reactivated' : 'group_suspended',
        groupId: input.groupId,
        path: GROUPS_PATH,
      },
    });
  }

  return { message: `Group ${input.status === 'active' ? 'activated' : 'suspended'}.` };
};
