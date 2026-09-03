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

  const activityId = toStringValue(meta?.activityId);
  if (activityId) {
    return `/activity/${activityId}`;
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
  if (kind === 'host_application_submitted' || kind === 'organizer_application_submitted') {
    return '/admin/hosts';
  }
  if (kind === 'host_application_approved' || kind === 'organizer_application_approved') {
    return '/host/overview';
  }
  if (kind === 'host_application_rejected' || kind === 'organizer_application_rejected') {
    return '/become-host';
  }
  if (kind === 'host_suspended' || kind === 'host_reopened') {
    return kind === 'host_suspended' ? '/become-host' : '/host/overview';
  }
  if (kind === 'user_suspended' || kind === 'user_reactivated') {
    return '/profile';
  }
  if (kind === 'location_rejected') {
    return '/discovery';
  }

  if (options?.preferAdminRoutes) {
    if (
      kind === 'host_application_submitted' ||
      kind === 'organizer_application_submitted' ||
      toStringValue(meta?.applicationId)
    ) {
      return '/admin/hosts';
    }
    if (toStringValue(meta?.userId)) return '/admin/users';
    if (toStringValue(meta?.groupId)) return '/admin/groups';
    if (toStringValue(meta?.activityId)) return '/admin/activities';
    if (toStringValue(meta?.locationId)) return '/admin/locations';
    if (toStringValue(meta?.productId)) return '/admin/shop';

    const adminText = `${notif.title} ${notif.body}`.toLowerCase();
    if (adminText.includes('application') || adminText.includes('host')) return '/admin/hosts';
    if (adminText.includes('user')) return '/admin/users';
    if (adminText.includes('group')) return '/admin/groups';
    if (adminText.includes('activity') || adminText.includes('trip')) return '/admin/activities';
    if (adminText.includes('location')) return '/admin/locations';
    if (adminText.includes('product') || adminText.includes('shop')) return '/admin/shop';
  }

  return '/profile';
};
