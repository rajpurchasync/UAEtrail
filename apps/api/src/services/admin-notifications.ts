import { NotificationType } from '../domain/enums.js';
import { listAuthUsers } from '../lib/auth-users.js';
import { scheduleNotification } from './notifications.js';

export const notifyPlatformAdmins = async (input: {
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}): Promise<void> => {
  const admins = await listAuthUsers({ role: 'PLATFORM_ADMIN', status: 'ACTIVE', take: 100 });
  await Promise.all(
    admins.map((admin) =>
      scheduleNotification(
        {
          userId: admin._id,
          title: input.title,
          body: input.body,
          type: NotificationType.SYSTEM,
          meta: input.meta,
        },
        'platform_admin_broadcast'
      )
    )
  );
};

export const notifyUserAdminAction = async (input: {
  userId: string;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
  reason?: string | null;
}): Promise<void> => {
  const reason = input.reason?.trim();
  scheduleNotification(
    {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: NotificationType.SYSTEM,
      meta: {
        ...input.meta,
        ...(reason ? { comment: reason } : {}),
      },
    },
    'admin_user_action'
  );
};
