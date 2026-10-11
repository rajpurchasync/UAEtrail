/**
 * Admin console paths — keep in sync with `apps/api/src/lib/member-routes.ts` notification meta.
 */

export const ADMIN_OVERVIEW_PATH = '/admin/overview' as const;
export const ADMIN_USERS_PATH = '/admin/users' as const;
export const ADMIN_HOSTS_PATH = '/admin/hosts' as const;
export const ADMIN_ACTIVITIES_PATH = '/admin/activities' as const;
export const ADMIN_AREAS_PATH = '/admin/areas' as const;

export const adminPlacesPath = (areaId?: string | null): string =>
  areaId ? `/admin/places?areaId=${encodeURIComponent(areaId)}` : '/admin/places';
export const ADMIN_GROUPS_PATH = '/admin/groups' as const;
export const ADMIN_SHOP_PATH = '/admin/shop' as const;
export const ADMIN_NOTIFICATIONS_PATH = '/admin/notifications' as const;
export const ADMIN_AUDIT_LOG_PATH = '/admin/audit-log' as const;
export const ADMIN_REPORTS_PATH = '/admin/reports' as const;
export const ADMIN_SETTINGS_PATH = '/admin/settings' as const;
