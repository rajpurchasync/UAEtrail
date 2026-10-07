import {
  Bell,
  Compass,
  LogIn,
  Map,
  MessageCircle,
  ShoppingBag,
  User,
  type LucideIcon
} from 'lucide-react';

/** Shared outline icons for mobile nav + participant UI (landing drawer + legacy labels). */
export const NAV_ICONS = {
  explore: Map,
  activities: Compass,
  shop: ShoppingBag,
  profile: User
} satisfies Record<string, LucideIcon>;

export const MOBILE_NAV_ICON_MAP: Record<
  | 'Explore'
  | 'Activities'
  | 'Shop'
  | 'Profile'
  | 'Trail catalog'
  | 'Upcoming Activities'
  | 'Gears Shop'
  | 'Explore Map'
  | 'My Profile'
  | 'My activities'
  | 'My trips'
  | 'Notifications'
  | 'Join'
  | 'Join free'
  | 'Log in'
  | 'Contact',
  LucideIcon
> = {
  'Explore Map': NAV_ICONS.explore,
  Explore: NAV_ICONS.explore,
  Join: NAV_ICONS.activities,
  'Join free': NAV_ICONS.activities,
  'Log in': LogIn,
  Contact: MessageCircle,
  Activities: NAV_ICONS.activities,
  Shop: NAV_ICONS.shop,
  Profile: NAV_ICONS.profile,
  'My Profile': NAV_ICONS.profile,
  Notifications: Bell,
  'Trail catalog': Map,
  'My activities': NAV_ICONS.activities,
  'My trips': NAV_ICONS.activities,
  'Upcoming Activities': NAV_ICONS.activities,
  'Gears Shop': NAV_ICONS.shop,
};

/** Consistent stroke for outline icons in consumer UI */
export const iconStroke = {
  default: 2,
  active: 2.25
} as const;
