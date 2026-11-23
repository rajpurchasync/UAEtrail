import type { NotificationDTO } from '@uaetrail/shared-types';

const metaRecord = (meta: NotificationDTO['meta']): Record<string, unknown> | null =>
  meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : null;

export const notificationKind = (notif: NotificationDTO): string => {
  const meta = metaRecord(notif.meta);
  const kind = meta?.kind;
  return typeof kind === 'string' ? kind.toLowerCase() : '';
};

/** DMs, group crew chat, replies, and reactions — not activity join or friend-request alerts. */
export const isMessagingNotification = (notif: NotificationDTO): boolean => {
  const kind = notificationKind(notif);
  const text = `${notif.title} ${notif.body}`.toLowerCase();

  if (kind === 'message' || kind === 'group_message') return true;

  if (
    kind.includes('message_reply') ||
    kind.includes('chat_reply') ||
    kind.includes('wall_reply') ||
    kind.includes('message_reaction') ||
    kind.includes('chat_reaction')
  ) {
    return true;
  }

  if (text.includes('new message in')) return true;
  if (text.includes('replied to your message') || text.includes('replied to you')) return true;
  if (text.includes('reacted to your message') || text.includes('reacted to your')) return true;
  if (text.includes('reaction to your message')) return true;

  const meta = metaRecord(notif.meta);
  if (meta?.chatMessageId || meta?.messageId) {
    if (kind !== 'group_invite' && kind !== 'group_invite_accepted') return true;
  }

  return false;
};

export const isTopCardMessagingNotification = (notif: NotificationDTO): boolean =>
  !notif.isRead && isMessagingNotification(notif);

export const sortNotificationsNewestFirst = (items: NotificationDTO[]): NotificationDTO[] =>
  [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

export const notificationRowSurfaceClass = (isRead: boolean, interactive = true): string => {
  const base = interactive ? 'transition-colors' : '';
  if (isRead) {
    return `${base} bg-neutral-50/90 border-neutral-100/90 text-neutral-800`;
  }
  return `${base} bg-emerald-50/90 border-emerald-100 text-neutral-900`;
};
