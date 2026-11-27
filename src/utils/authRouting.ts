import {
  EXPLORE_MAP_PATH,
  ADMIN_INBOX_PATH,
  ADMIN_ACCOUNT_PATH,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  PLAN_PATH,
  PROFILE_PATH,
  PRO_MEMBERSHIP_PATH,
  messagesToUserPath,
} from '../config/routingCatalog';
import { planHostingFilterPath } from '../plan/planRouting';
import { UserRole, canonicalizeInboundProductPath } from '@uaetrail/shared-types';

import { OPERATOR_PROFILE_PATH, operatorDeskProfilePath } from '../config/routingCatalog';
import { isPlatformAdmin } from './roles';

export const defaultRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return ADMIN_INBOX_PATH;
  return EXPLORE_MAP_PATH;
};

/** Personal hub (profile / admin account) — not the host-mode home. */
export const accountRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return ADMIN_ACCOUNT_PATH;
  return PROFILE_PATH;
};

/**
 * Stale `/publishing/*`, `/operator/*`, and other console bookmarks for members **without**
 * `canAccessPublishingWorkspace`. Consumer equivalents only — not explore compose shims (O0.5).
 */
export const participantHostBookmarkRedirect = (pathname: string): string => {
  const canonical = canonicalizeInboundProductPath(pathname);
  const canonicalPathname = canonical.split('?')[0]?.split('#')[0] ?? pathname;
  if (
    canonicalPathname !== pathname &&
    !/^\/(?:publishing|operator)(?=\/|$)/.test(canonicalPathname)
  ) {
    return canonicalPathname;
  }
  const rest = canonicalPathname.replace(/^\/(?:publishing|operator)(?=\/|$)/, '') || '/';
  if (rest.startsWith('/messages')) {
    return MESSAGES_PATH;
  }
  if (rest.startsWith('/requests')) return MY_REQUESTS_PATH;
  if (rest.startsWith('/activities')) return planHostingFilterPath();
  if (rest.startsWith('/places') || rest.startsWith('/locations')) {
    return OPERATOR_PROFILE_PATH;
  }
  if (rest.startsWith('/profile') || rest.startsWith('/manage')) {
    return operatorDeskProfilePath();
  }
  if (rest.startsWith('/team')) {
    return PRO_MEMBERSHIP_PATH;
  }
  if (rest === '/overview' || rest.startsWith('/overview')) {
    return PROFILE_PATH;
  }
  if (rest.startsWith('/history')) return PLAN_PATH;
  if (rest.startsWith('/security-privacy')) return PROFILE_PATH;
  return PLAN_PATH;
};

/** Deep link to messages for the current role. */
export const messagesRouteForRole = (
  role: UserRole,
  userId: string,
  options?: { activityId?: string }
): string => {
  if (role === 'platform_admin') return ADMIN_INBOX_PATH;
  if (role === 'merchant_admin') return MESSAGES_PATH;
  const base = messagesToUserPath(userId);
  if (!options?.activityId) {
    return base;
  }
  const params = new URLSearchParams({ to: userId, activity: options.activityId });
  return `${MESSAGES_PATH}?${params.toString()}`;
};
