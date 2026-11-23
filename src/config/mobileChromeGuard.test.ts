import { describe, expect, it } from 'vitest';
import { EXPLORE_SEARCH_RESULTS_PATH } from '../explore/search/exploreSearchRouting';
import { isLayoutMobileUnifiedHeaderRoute } from './mobileTabHeader';
import {
  hasConsumerSelfHeader,
  isEntityDetailRoute,
  MOBILE_BOTTOM_NAV_PROFILE_PATHS,
  MOBILE_BOTTOM_NAV_TAB_PATHS,
} from './platform';
import {
  APP_SETTINGS_ACCOUNT_PATH,
  APP_SETTINGS_DISPLAY_PATH,
  APP_SETTINGS_PATH,
  APP_SETTINGS_SAFETY_PATH,
  MY_CREWS_PATH,
  GROUPS_PATH,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH,
  APP_SETTINGS_NOTIFICATIONS_SAVED_PATH,
  PLAN_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_EDIT_PATH,
  PROFILE_HISTORY_PATH,
  PROFILE_PATH,
  PROFILE_SUBMISSIONS_PATH,
  JOURNEY_MAP_PATH,
} from './surfacePaths';

const LAYOUT_UNIFIED_EXACT = [
  '/faq',
  '/terms',
  '/privacy',
  '/security-privacy',
  PROFILE_SUBMISSIONS_PATH,
  MY_REQUESTS_PATH,
  APP_SETTINGS_PATH,
  APP_SETTINGS_DISPLAY_PATH,
  APP_SETTINGS_ACCOUNT_PATH,
  PROFILE_EDIT_PATH,
  '/profile/pro-membership',
  PROFILE_BADGES_PATH,
] as const;

const CONSUMER_SHELL_STACK_PATHS = [
  '/about',
  '/contact',
  '/sitemap',
  APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH,
  APP_SETTINGS_NOTIFICATIONS_SAVED_PATH,
  '/my-requests/req-1',
] as const;

const ENTITY_DETAIL_SAMPLES = [
  '/activity/a1',
  '/trail/t1',
  '/shop/merchant-1',
  '/plan/today',
  '/agency/slug',
  '/partner/slug',
] as const;

describe('mobileChromeGuard', () => {
  it('layout unified header routes use self header (no duplicate layout chrome)', () => {
    const paths = [
      ...MOBILE_BOTTOM_NAV_TAB_PATHS,
      PROFILE_PATH,
      PLAN_PATH,
      PROFILE_HISTORY_PATH,
      JOURNEY_MAP_PATH,
      MESSAGES_PATH,
      ...MOBILE_BOTTOM_NAV_PROFILE_PATHS,
      ...LAYOUT_UNIFIED_EXACT,
      APP_SETTINGS_SAFETY_PATH,
      '/profile/reviews',
      '/profile/vehicles',
    ];
    const missing = paths.filter(
      (p) =>
        isLayoutMobileUnifiedHeaderRoute(p) &&
        !isEntityDetailRoute(p) &&
        !hasConsumerSelfHeader(p)
    );
    expect(missing).toEqual([]);
  });

  it('ConsumerShell stack pages declare self header', () => {
    const missing = CONSUMER_SHELL_STACK_PATHS.filter((p) => !hasConsumerSelfHeader(p));
    expect(missing).toEqual([]);
  });

  it('search results uses unified tab header chrome', () => {
    expect(hasConsumerSelfHeader(EXPLORE_SEARCH_RESULTS_PATH)).toBe(true);
    expect(isLayoutMobileUnifiedHeaderRoute(EXPLORE_SEARCH_RESULTS_PATH)).toBe(true);
  });

  it('unified header + navbar never stacks for signed-in bottom-nav surfaces', () => {
    const paths = [
      ...MOBILE_BOTTOM_NAV_TAB_PATHS,
      PROFILE_PATH,
      MY_CREWS_PATH,
      GROUPS_PATH,
      APP_SETTINGS_NOTIFICATIONS_PATH,
      ...LAYOUT_UNIFIED_EXACT,
    ];
    const dualRisk = paths.filter(
      (p) =>
        isLayoutMobileUnifiedHeaderRoute(p) &&
        !isEntityDetailRoute(p) &&
        !hasConsumerSelfHeader(p)
    );
    expect(dualRisk).toEqual([]);
  });

  it('entity detail and member cards use detail or self header', () => {
    for (const p of ENTITY_DETAIL_SAMPLES) {
      expect(isEntityDetailRoute(p)).toBe(true);
      expect(hasConsumerSelfHeader(p) || isEntityDetailRoute(p)).toBe(true);
    }
    expect(hasConsumerSelfHeader('/member/user-1')).toBe(true);
  });
});
