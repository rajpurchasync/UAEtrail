import { listBroadcastNotificationAuditLogs } from '../lib/admin-store.js';

export const listAdminBroadcastNotifications = async (take = 20) => {
  const logs = await listBroadcastNotificationAuditLogs(take);
  return logs.map((l) => {
    const meta = l.metadata as Record<string, unknown> | null;
    return {
      id: l.id,
      title: 'System Notification',
      body: `Sent by ${l.actor.profile?.displayName ?? l.actor.email}`,
      targetRole: (meta?.targetRole as string) ?? null,
      recipientCount: (meta?.recipientCount as number) ?? 0,
      createdAt: l.createdAt,
    };
  });
};
