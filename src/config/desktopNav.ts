import {
  Award,
  Bell,
  CalendarDays,
  ClipboardList,
  Compass,
  History,
  Map,
  MapPin,
  MessageCircle,
  PlusCircle,
  Search,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { isDiscoverBrowseRoute } from '../explore/exploreDiscoverBrowse';
import { explorePath, explorePeopleBrowsePath } from '../explore/routing';
import {
  BUDDIES_PATH,
  EXPLORE_DISCOVER_BROWSE_PATH,
  EXPLORE_MAP_PATH,
  GROUPS_PATH,
  JOURNEY_MAP_PATH,
  LIST_DISCOVERY_PATH,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  NOTIFICATIONS_PATH,
  PLAN_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_HISTORY_PATH,
  PROFILE_PATH,
  PROFILE_SETTINGS_PATH,
  PROFILE_SUBMISSIONS_PATH,
} from './routingCatalog';
import { PRODUCT_PLAN_SURFACE_TITLE, PRODUCT_PLAN_MEMBER_NAV_HINT } from '../content/productNorthStar';
import { LIST_CAT_PARAM } from '../list/browseListUrlState';

/** Wide app chrome (Tailwind `md`, ≥768px) — left sidebar + slim top bar. Mobile uses bottom nav + drawer. */
export const DESKTOP_MIN_WIDTH_PX = 768;

export type DesktopNavBadge = 'chat' | 'notifications';

export type DesktopNavItem = {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Tooltip — sidebar link context. */
  navHint?: string;
  /** Path prefixes that mark the item active (exact match or `prefix/…`). */
  match: readonly string[];
  badge?: DesktopNavBadge;
  /** Guests are sent to sign-in with return to `to`. */
  authGate?: true;
};

/** Signed-in left nav — Explore first, then stacked destinations. Guests still use the top bar. */
export const DESKTOP_PRIMARY_NAV: readonly DesktopNavItem[] = [
  { key: 'explore', label: 'Explore', to: EXPLORE_MAP_PATH, icon: Map, match: [EXPLORE_MAP_PATH] },
  {
    key: 'browse',
    label: 'Browse',
    to: LIST_DISCOVERY_PATH,
    icon: Compass,
    match: [LIST_DISCOVERY_PATH, EXPLORE_DISCOVER_BROWSE_PATH],
  },
  {
    key: 'plan',
    label: PRODUCT_PLAN_SURFACE_TITLE,
    to: PLAN_PATH,
    icon: CalendarDays,
    match: [PLAN_PATH],
    authGate: true,
    navHint: PRODUCT_PLAN_MEMBER_NAV_HINT,
  },
  {
    key: 'friends',
    label: 'Friends',
    to: BUDDIES_PATH,
    icon: Users,
    match: [BUDDIES_PATH],
    authGate: true,
  },
  {
    key: 'groups',
    label: 'Groups',
    to: GROUPS_PATH,
    icon: UsersRound,
    match: [GROUPS_PATH],
    authGate: true,
  },
  {
    key: 'chat',
    label: 'Chat',
    to: MESSAGES_PATH,
    icon: MessageCircle,
    match: [MESSAGES_PATH],
    badge: 'chat',
    authGate: true,
  },
];

export type DesktopSideNavSection = {
  key: string;
  title: string;
  items: readonly DesktopNavItem[];
};

/** Map actions that used to live on explore chrome (md+). */
export const DESKTOP_MAP_NAV: readonly DesktopNavItem[] = [
  {
    key: 'findCrew',
    label: 'Find Crew',
    to: explorePeopleBrowsePath({ list: false }),
    icon: Users,
    match: [],
  },
  {
    key: 'search',
    label: 'Search',
    to: `${EXPLORE_MAP_PATH}?search=1`,
    icon: Search,
    match: [],
  },
  {
    key: 'post',
    label: 'Post',
    to: explorePath({ compose: 'menu' }),
    icon: PlusCircle,
    match: [],
    authGate: true,
  },
];

/** Left sidebar — hub destinations below the primary stack (Friends / Groups live in primary). */
export const DESKTOP_SIDE_NAV_SECTIONS: readonly DesktopSideNavSection[] = [
  {
    key: 'crew',
    title: 'Your crew',
    items: [
      {
        key: 'notifications',
        label: 'Notifications',
        to: NOTIFICATIONS_PATH,
        icon: Bell,
        match: [NOTIFICATIONS_PATH],
        badge: 'notifications',
      },
    ],
  },
  {
    key: 'you',
    title: 'You',
    items: [
      {
        key: 'history',
        label: 'Outing history',
        to: PROFILE_HISTORY_PATH,
        icon: History,
        match: [PROFILE_HISTORY_PATH, JOURNEY_MAP_PATH],
      },
      { key: 'requests', label: 'Join requests', to: MY_REQUESTS_PATH, icon: ClipboardList, match: [MY_REQUESTS_PATH] },
      { key: 'badges', label: 'Badges', to: PROFILE_BADGES_PATH, icon: Award, match: [PROFILE_BADGES_PATH] },
      {
        key: 'submissions',
        label: 'Submissions',
        to: PROFILE_SUBMISSIONS_PATH,
        icon: MapPin,
        match: [PROFILE_SUBMISSIONS_PATH],
      },
      {
        key: 'settings',
        label: 'Settings',
        to: PROFILE_SETTINGS_PATH,
        icon: Settings,
        match: [PROFILE_SETTINGS_PATH],
      },
    ],
  },
];

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isDesktopNavItemActive = (item: DesktopNavItem, pathname: string, search: string): boolean => {
  if (item.key === 'explore') {
    return (
      (pathname === EXPLORE_MAP_PATH || pathname === '/discovery') && !isDiscoverBrowseRoute(pathname, search)
    );
  }
  const params = new URLSearchParams(search);
  const peopleLens =
    pathname === LIST_DISCOVERY_PATH && params.get(LIST_CAT_PARAM) === 'people';
  if (item.key === 'browse') {
    return (pathname === LIST_DISCOVERY_PATH && !peopleLens) || isDiscoverBrowseRoute(pathname, search);
  }
  if (item.key === 'findCrew') {
    const view = params.get('view');
    return pathname === EXPLORE_MAP_PATH && (view === 'people' || view === 'social' || view === 'going');
  }
  if (item.key === 'search') {
    return pathname === EXPLORE_MAP_PATH && params.get('search') === '1';
  }
  if (item.key === 'post') {
    return pathname === EXPLORE_MAP_PATH && Boolean(params.get('compose'));
  }
  if (item.key === 'plan') {
    return matchesPrefix(pathname, PLAN_PATH);
  }
  return item.match.some((prefix) => matchesPrefix(pathname, prefix));
};

/** Tablet/desktop chrome — explore map and stacked product views (guests and members). */
export const shouldShowDesktopSideNav = (pathname: string, _signedIn: boolean): boolean => {
  if (pathname === JOURNEY_MAP_PATH) return false;
  return true;
};

const NAV_ROOT_PATHS: readonly string[] = [
  PROFILE_PATH,
  ...DESKTOP_PRIMARY_NAV.map((item) => item.to),
  ...DESKTOP_MAP_NAV.map((item) => item.to.split('?')[0]),
  ...DESKTOP_SIDE_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.to.split('?')[0])),
];

/** Top-bar / sidebar / drawer destinations — tablet & desktop page chrome needs no Back row here. */
export const isWideNavRootPath = (pathname: string): boolean => NAV_ROOT_PATHS.includes(pathname);

