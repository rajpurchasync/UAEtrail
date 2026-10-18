import { UserRole, UserStatus } from '../domain/enums.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { revokeRefreshTokensByUser } from '../lib/auth-tokens-store.js';
import { findAuthUserById, updateAuthUserStatus } from '../lib/auth-users-store.js';
import { PROFILE_PATH } from '../lib/member-routes.js';
import { notifyUserAdminAction } from './admin-notifications.js';

export const setAdminUserStatus = async (input: {
  actorId: string;
  userId: string;
  status: 'active' | 'suspended';
  comment?: string;
}) => {
  const user = await findAuthUserById(input.userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }
  if (user.role === UserRole.PLATFORM_ADMIN) {
    throw new ApiError(400, 'cannot_modify_admin', 'Cannot modify admin status.');
  }

  const prismaStatus = input.status === 'active' ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
  await updateAuthUserStatus(input.userId, prismaStatus);
  if (input.status === 'suspended') {
    await revokeRefreshTokensByUser(input.userId);
  }

  await createAuditLog({
    actorId: input.actorId,
    action: `user.${input.status === 'active' ? 'activate' : 'suspend'}`,
    entityType: 'user',
    entityId: input.userId,
    metadata: input.comment ? { comment: input.comment } : undefined,
  });

  await notifyUserAdminAction({
    userId: input.userId,
    title: input.status === 'active' ? 'Account reactivated' : 'Account suspended',
    body:
      input.status === 'active'
        ? 'Your account access has been restored.'
        : input.comment
          ? `Your account has been suspended. Reason: ${input.comment}`
          : 'Your account has been suspended by an administrator. Contact support if you believe this is a mistake.',
    reason: input.comment,
    meta: {
      kind: input.status === 'active' ? 'user_reactivated' : 'user_suspended',
      path: PROFILE_PATH,
    },
  });

  return { message: `User ${input.status === 'active' ? 'activated' : 'suspended'}.` };
};
