import { NotificationDTO } from '@uaetrail/shared-types';

const toMetaObject = (meta: NotificationDTO['meta']): Record<string, unknown> | null =>
  meta && typeof meta === 'object' ? meta : null;

const toStringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

export const inferNotificationPath = (
  notif: NotificationDTO,
  options?: { preferAdminRoutes?: boolean }
): string => {
  const meta = toMetaObject(notif.meta);

  const directPath = toStringValue(meta?.path);
  if (directPath && directPath.startsWith('/')) {
    return directPath;
  }

  const reviewPath = toStringValue(meta?.reviewPath);
  if (reviewPath && reviewPath.startsWith('/')) {
    return `${reviewPath}#reviews`;
  }

  const requestId = toStringValue(meta?.requestId);
  if (requestId) {
    return `/my-requests/${requestId}`;
  }

  const eventId = toStringValue(meta?.eventId);
  if (eventId) {
    return `/trip/${eventId}`;
  }

  const senderId = toStringValue(meta?.senderId);
  if (senderId) {
    return `/messages?to=${encodeURIComponent(senderId)}`;
  }

  const kind = toStringValue(meta?.kind)?.toLowerCase() ?? '';
  if (kind === 'reward' || kind === 'tier_upgrade' || kind === 'badge') {
    return '/my-rewards';
  }
  if (kind.includes('buddy')) {
    return '/groups';
  }
  if (kind === 'location_approved') {
    return '/discovery';
  }
  if (kind === 'organizer_application_submitted') {
    return '/admin/organizers';
  }
  if (kind === 'organizer_application_approved') {
    return '/organizer/overview';
  }
  if (kind === 'organizer_application_rejected') {
    return '/become-host';
  }
  if (kind === 'host_suspended' || kind === 'host_reopened') {
    return kind === 'host_suspended' ? '/become-host' : '/organizer/overview';
  }
  if (kind === 'user_suspended' || kind === 'user_reactivated') {
    return '/profile';
  }
  if (kind === 'location_rejected') {
    return '/discovery';
  }

  if (options?.preferAdminRoutes) {
    if (kind === 'organizer_application_submitted' || toStringValue(meta?.applicationId)) {
      return '/admin/organizers';
    }
    if (toStringValue(meta?.userId)) return '/admin/users';
    if (toStringValue(meta?.groupId)) return '/admin/groups';
    if (toStringValue(meta?.eventId)) return '/admin/events';
    if (toStringValue(meta?.locationId)) return '/admin/locations';
    if (toStringValue(meta?.productId)) return '/admin/shop';

    const adminText = `${notif.title} ${notif.body}`.toLowerCase();
    if (adminText.includes('application') || adminText.includes('host')) return '/admin/organizers';
    if (adminText.includes('location')) return '/admin/locations';
    if (adminText.includes('group')) return '/admin/groups';
    if (adminText.includes('event') || adminText.includes('trip')) return '/admin/events';
    if (adminText.includes('user') || adminText.includes('account')) return '/admin/users';
    if (adminText.includes('shop') || adminText.includes('product')) return '/admin/shop';

    return '/admin/notifications';
  }

  if (notif.type === 'event') return '/trips?tab=mine';
  if (notif.type === 'request_update') return '/my-requests';

  const text = `${notif.title} ${notif.body}`.toLowerCase();
  if (text.includes('message')) return '/messages';
  if (text.includes('reminder') || text.includes('trip')) return '/trips?tab=mine';
  if (text.includes('buddy') || text.includes('group')) return '/groups';
  if (text.includes('comment') || text.includes('like')) return '/community';

  return '/notifications';
};