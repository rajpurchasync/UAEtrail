/**
 * Admin console paths — keep in sync with `apps/api/src/lib/member-routes.ts` notification meta.
 */

/** Legacy bookmark — redirects to {@link ADMIN_INBOX_PATH}. */
export const ADMIN_OVERVIEW_PATH = '/admin/overview' as const;
/** Work-queue hub (replaces Overview as the console home). */
export const ADMIN_INBOX_PATH = '/admin/inbox' as const;
export const ADMIN_INBOX_SUBMISSIONS_PATH = '/admin/inbox/submissions' as const;
export const ADMIN_USERS_PATH = '/admin/users' as const;
export const ADMIN_HOSTS_PATH = '/admin/hosts' as const;
export const ADMIN_ACTIVITIES_PATH = '/admin/activities' as const;
export const ADMIN_AREAS_PATH = '/admin/areas' as const;

export const ADMIN_FACILITIES_PATH = '/admin/facilities' as const;

export const adminPlacesPath = (areaId?: string | null): string =>
  areaId ? `/admin/places?areaId=${encodeURIComponent(areaId)}` : '/admin/places';

export const adminFacilitiesPath = (areaId?: string | null): string =>
  areaId ? `${ADMIN_FACILITIES_PATH}?areaId=${encodeURIComponent(areaId)}` : ADMIN_FACILITIES_PATH;
export const ADMIN_GROUPS_PATH = '/admin/groups' as const;
/** Discoverable clubs (`MIG-COMMUNITY-DISCOVER`) — not {@link ADMIN_GROUPS_PATH} teams. */
export const ADMIN_COMMUNITIES_PATH = '/admin/communities' as const;
/** Inbound bookmark only — retired shop catalog admin; redirects to {@link ADMIN_HOSTS_PATH}. */
export const INBOUND_ADMIN_SHOP_PATH = '/admin/shop' as const;
export const ADMIN_NOTIFICATIONS_PATH = '/admin/notifications' as const;
export const ADMIN_AUDIT_LOG_PATH = '/admin/audit-log' as const;
export const ADMIN_REPORTS_PATH = '/admin/reports' as const;
export const ADMIN_ALERTS_PATH = '/admin/alerts' as const;
export const ADMIN_SETTINGS_PATH = '/admin/settings' as const;
export const ADMIN_ACCOUNT_PATH = '/admin/account' as const;
