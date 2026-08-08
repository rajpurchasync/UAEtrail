import type { QueryClient } from '@tanstack/react-query';

export const notificationUnreadBadgeKey = (userId?: string | null) =>
  ['me-notification-unread-badge', userId] as const;

export const invalidateNotificationUnreadBadge = (queryClient: QueryClient, userId?: string | null) =>
  queryClient.invalidateQueries({ queryKey: notificationUnreadBadgeKey(userId) });