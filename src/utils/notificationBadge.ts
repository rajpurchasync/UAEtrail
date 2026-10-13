import type { QueryClient } from '@tanstack/react-query';
import { notificationUnreadBadgeKey } from '../hooks/clientQueryKeys';

export { notificationUnreadBadgeKey } from '../hooks/clientQueryKeys';

export const invalidateNotificationUnreadBadge = (queryClient: QueryClient, userId?: string | null) =>
  queryClient.invalidateQueries({ queryKey: notificationUnreadBadgeKey(userId) });