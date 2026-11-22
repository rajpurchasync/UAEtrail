import {
  Award,
  CalendarDays,
  ClipboardList,
  History,
  Map,
  MapPin,
  MessageCircle,
  PlusCircle,
  Search,
  Settings,
  UserSearch,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { isDiscoverBrowseRoute } from '../explore/exploreDiscoverBrowse';
import { explorePath, exploreCrewsPath } from '../explore/routing';
import {
  BUDDIES_PATH,
  EXPLORE_DISCOVER_BROWSE_PATH,
  EXPLORE_MAP_PATH,
  GROUPS_PATH,
  JOURNEY_MAP_PATH,
  LIST_DISCOVERY_PATH,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  PLAN_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_HISTORY_PATH,
  PROFILE_PATH,
  PROFILE_SETTINGS_PATH,
  PROFILE_SUBMISSIONS_PATH,
  OPERATOR_CONSOLE_PREFIX,
} from './routingCatalog';
import {
  PRODUCT_PLAN_SURFACE_TITLE,
  PRODUCT_PLAN_MEMBER_NAV_HINT,
  PRODUCT_SOCIAL_NAV_HINT,
  PRODUCT_MY_CREW_SURFACE_TITLE,
} from '../content/productNorthStar';
import { LIST_CAT_PARAM } from '../list/browse/browseListUrlState';
import { isPlanHostingFilterRoute } from '../plan/planRouting';
import { isOperatorConsolePath } from './surfacePaths';

/** Wide app chrome (Tailwind `md`, ≥768px) — left sidebar + slim top bar. Mobile uses bottom nav + drawer. */
export const DESKTOP_MIN_WIDTH_PX = 768;

export type DesktopNavBadge = 'chat';

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
  /** Show in the guest sidebar (default: hide auth-gated personal dumps). */
  guestVisible?: true;
};

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Full-screen people catalog (`/list?listCat=people`) — Social, not Explore. */
export const isPeopleListDiscoveryRoute = (pathname: string, search: string): boolean =>
  pathname === LIST_DISCOVERY_PATH && new URLSearchParams(search).get(LIST_CAT_PARAM) === 'people';

/** Explore map URLs owned by a sibling sidebar item (Find crew, Search, Post) — not the Explore hub. */
const isExploreMapExclusiveNavMode = (pathname: string, search: string): boolean => {
  if (pathname !== EXPLORE_MAP_PATH) return false;
  const params = new URLSearchParams(search);
  const view = params.get('view');
  if (view === 'people' || view === 'social' || view === 'going') return true;
  if (params.get('search') === '1') return true;
  if (params.get('compose')) return true;
  return false;
};

/** Map + list catalog (not people list). One GO item; list remains an in-page / `/list` projection. */
export const isDesktopExploreNavActive = (pathname: string, search: string): boolean => {
  if (isPeopleListDiscoveryRoute(pathname, search)) return false;
  if (isExploreMapExclusiveNavMode(pathname, search)) return false;
  return (
    pathname === EXPLORE_MAP_PATH ||
    pathname === '/discovery' ||
    pathname === LIST_DISCOVERY_PATH ||
    isDiscoverBrowseRoute(pathname, search)
  );
};

export const isDesktopSocialNavActive = (pathname: string, search: string): boolean => {
  if (matchesPrefix(pathname, BUDDIES_PATH) || matchesPrefix(pathname, GROUPS_PATH)) return true;
  return isPeopleListDiscoveryRoute(pathname, search);
};

/** Signed-in left nav — where you go. People live in their own section. */
export const DESKTOP_PRIMARY_NAV: readonly DesktopNavItem[] = [
  {
    key: 'explore',
    label: 'Explore',
    to: EXPLORE_MAP_PATH,
    icon: Map,
    match: [EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH, EXPLORE_DISCOVER_BROWSE_PATH],
    guestVisible: true,
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
    key: 'chat',
    label: 'Chat',
    to: MESSAGES_PATH,
    icon: MessageCircle,
    match: [MESSAGES_PATH],
    badge: 'chat',
    authGate: true,
    guestVisible: true,
  },
];

/** Find people and the friends/groups you already have. Members only. */
export const DESKTOP_PEOPLE_SECTION_TITLE = 'People';

export const DESKTOP_PEOPLE_NAV: readonly DesktopNavItem[] = [
  {
    key: 'findCrew',
    label: 'Find Crew',
    to: exploreCrewsPath({ list: false }),
    icon: UserSearch,
    match: [],
    authGate: true,
    navHint: 'People looking to get outside.',
  },
  {
    key: 'social',
    label: PRODUCT_MY_CREW_SURFACE_TITLE,
    to: BUDDIES_PATH,
    icon: Users,
    match: [BUDDIES_PATH, GROUPS_PATH],
    authGate: true,
    navHint: PRODUCT_SOCIAL_NAV_HINT,
  },
];

export type DesktopSideNavSection = {
  key: string;
  title: string;
  items: readonly DesktopNavItem[];
};

/** Map tools — search the map and post an outing. */
export const DESKTOP_MAP_SECTION_TITLE = 'Map';

export const DESKTOP_MAP_NAV: readonly DesktopNavItem[] = [
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
    to: explorePath({ compose: { surface: 'menu', composeKind: 'activity' } }),
    icon: PlusCircle,
    match: [],
    authGate: true,
  },
];

/** Left sidebar — hub destinations below the primary stack. */
export const DESKTOP_SIDE_NAV_SECTIONS: readonly DesktopSideNavSection[] = [
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

/** Visual catalog (`/list`), not the map and not the people catalog. */
export const isDesktopExploreBrowseView = (pathname: string, search: string): boolean =>
  !isPeopleListDiscoveryRoute(pathname, search) && isDiscoverBrowseRoute(pathname, search);

export const isDesktopHostingNavActive = (pathname: string, search: string): boolean =>
  isOperatorConsolePath(pathname) || isPlanHostingFilterRoute(pathname, search);

export const isDesktopNavItemActive = (item: DesktopNavItem, pathname: string, search: string): boolean => {
  if (item.key === 'explore') return isDesktopExploreNavActive(pathname, search);
  if (item.key === 'hosting') return isDesktopHostingNavActive(pathname, search);
  if (item.key === 'social') return isDesktopSocialNavActive(pathname, search);
  const params = new URLSearchParams(search);
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
    if (isPlanHostingFilterRoute(pathname, search)) return false;
    return matchesPrefix(pathname, PLAN_PATH);
  }
  return item.match.some((prefix) => matchesPrefix(pathname, prefix));
};

export const desktopPrimaryNavForSession = (signedIn: boolean): readonly DesktopNavItem[] =>
  DESKTOP_PRIMARY_NAV.filter((item) => signedIn || item.guestVisible || !item.authGate);

/** Tablet/desktop chrome — explore map and stacked product views (guests and members). */
export const shouldShowDesktopSideNav = (pathname: string, _signedIn: boolean): boolean => {
  if (pathname === JOURNEY_MAP_PATH) return false;
  return true;
};

const NAV_ROOT_PATHS: readonly string[] = [
  PROFILE_PATH,
  LIST_DISCOVERY_PATH,
  BUDDIES_PATH,
  GROUPS_PATH,
  ...DESKTOP_PRIMARY_NAV.map((item) => item.to),
  ...DESKTOP_PEOPLE_NAV.map((item) => item.to.split('?')[0]),
  ...DESKTOP_MAP_NAV.map((item) => item.to.split('?')[0]),
  ...DESKTOP_SIDE_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.to.split('?')[0])),
];

/** Top-bar / sidebar / drawer destinations — tablet & desktop page chrome needs no Back row here. */
export const isWideNavRootPath = (pathname: string): boolean => NAV_ROOT_PATHS.includes(pathname);
