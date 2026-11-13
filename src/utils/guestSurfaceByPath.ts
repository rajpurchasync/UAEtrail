import {
  BUDDIES_PATH,
  GROUPS_PATH,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  NOTIFICATIONS_PATH,
  NOTIFICATIONS_SAVED_PATH,
  NOTIFICATIONS_SETTINGS_PATH,
  PLAN_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_HISTORY_PATH,
  PROFILE_SETTINGS_ACCOUNT_PATH,
  PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
  PROFILE_SETTINGS_SAFETY_PATH,
  PROFILE_SUBMISSIONS_PATH,
  isNotificationHubPath,
} from '../config/routingCatalog';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../content/productNorthStar';
import type { GuestFeatureUnlockKey } from '../content/guestFeatureUnlockCopy';

export type GuestSurfaceGate = {
  feature: GuestFeatureUnlockKey;
  title: string;
};

const PREFIX_GATES: ReadonlyArray<{ prefix: string; gate: GuestSurfaceGate }> = [
  { prefix: PROFILE_SETTINGS_ACCOUNT_PATH, gate: { feature: 'settings-hub', title: 'Account' } },
  { prefix: PROFILE_SETTINGS_PRIVACY_PATH, gate: { feature: 'settings-hub', title: 'Privacy' } },
  { prefix: PROFILE_SETTINGS_NOTIFICATIONS_PATH, gate: { feature: 'settings-hub', title: 'Notifications' } },
  { prefix: PROFILE_SETTINGS_SAFETY_PATH, gate: { feature: 'settings-hub', title: 'Safety' } },
  { prefix: PROFILE_HISTORY_PATH, gate: { feature: 'outing-history', title: 'Outing history' } },
  { prefix: PROFILE_BADGES_PATH, gate: { feature: 'badges', title: 'Badges' } },
  { prefix: PROFILE_SUBMISSIONS_PATH, gate: { feature: 'submissions', title: 'Submissions' } },
  { prefix: MY_REQUESTS_PATH, gate: { feature: 'join-requests', title: 'Join requests' } },
  { prefix: NOTIFICATIONS_PATH, gate: { feature: 'settings-hub', title: 'Notifications' } },
  { prefix: NOTIFICATIONS_SETTINGS_PATH, gate: { feature: 'settings-hub', title: 'Notification settings' } },
  { prefix: NOTIFICATIONS_SAVED_PATH, gate: { feature: 'settings-hub', title: 'Saved map & alerts' } },
  { prefix: GROUPS_PATH, gate: { feature: 'groups', title: 'Groups' } },
  { prefix: BUDDIES_PATH, gate: { feature: 'friends', title: 'Friends' } },
  { prefix: MESSAGES_PATH, gate: { feature: 'chat', title: 'Chat' } },
  { prefix: PLAN_PATH, gate: { feature: 'plan', title: PRODUCT_PLAN_SURFACE_TITLE } },
];

const matchesPrefix = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Guest sidebar / member routes — show in-app explainer instead of auth full page. */
export const resolveGuestSurfaceForPath = (pathname: string): GuestSurfaceGate | null => {
  if (isNotificationHubPath(pathname)) {
    return { feature: 'settings-hub', title: 'Notifications' };
  }
  for (const entry of PREFIX_GATES) {
    if (matchesPrefix(pathname, entry.prefix)) return entry.gate;
  }
  return null;
};
