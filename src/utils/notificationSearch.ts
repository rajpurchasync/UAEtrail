import type { NotificationDTO } from '@uaetrail/shared-types';
import { notificationReasonLine } from './notificationDisplay';

const haystackFor = (notif: NotificationDTO): string => {
  const reason = notificationReasonLine(notif);
  return `${notif.title} ${notif.body} ${reason ?? ''}`.toLowerCase();
};

export const matchesNotificationSearch = (notif: NotificationDTO, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystackFor(notif).includes(q);
};
