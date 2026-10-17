import { UserRole } from '../domain/enums.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { listAuthUsers } from '../lib/auth-users.js';
import { createNotificationsMany } from '../lib/notifications-store.js';

export const broadcastAdminNotification = async (input: {
  actorId: string;
  title: string;
  body: string;
  targetRole?: string;
}) => {
  const users = await listAuthUsers({
    status: 'ACTIVE',
    role: input.targetRole ? (input.targetRole.toUpperCase() as UserRole) : undefined,
    take: 10000,
  });

  if (users.length === 0) {
    throw new ApiError(400, 'no_recipients', 'No users match the target criteria.');
  }

  await createNotificationsMany(
    users.map((u) => ({
      userId: u._id,
      title: input.title,
      body: input.body,
      type: 'SYSTEM' as const,
    }))
  );

  await createAuditLog({
    actorId: input.actorId,
    action: 'notification.broadcast',
    entityType: 'notification',
    entityId: 'system',
    metadata: { recipientCount: users.length, targetRole: input.targetRole ?? 'all' },
  });

  return { count: users.length };
};
