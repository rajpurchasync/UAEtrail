import { NotificationType } from '../domain/enums.js';
import { listAuthUsers } from '../lib/auth-users.js';
import { dispatchNotification } from './notifications.js';

export const notifyPlatformAdmins = async (input: {
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}): Promise<void> => {
  const admins = await listAuthUsers({ role: 'PLATFORM_ADMIN', status: 'ACTIVE', take: 100 });
  await Promise.all(
    admins.map((admin) =>
      dispatchNotification({
        userId: admin._id,
        title: input.title,
        body: input.body,
        type: NotificationType.SYSTEM,
        meta: input.meta
      }).catch(() => undefined)
    )
  );
};

export const notifyUserAdminAction = async (input: {
  userId: string;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}): Promise<void> => {
  await dispatchNotification({
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: NotificationType.SYSTEM,
    meta: input.meta
  }).catch(() => undefined);
};
