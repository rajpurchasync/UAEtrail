import {
  Bell,
  Compass,
  Map,
  MessageCircle,
  ShoppingBag,
  User,
  type LucideIcon
} from 'lucide-react';

/** Shared outline icons for mobile nav + participant UI (keep in sync with MOBILE_DRAWER_MENU). */
export const NAV_ICONS = {
  explore: Map,
  trips: Compass,
  community: MessageCircle,
  shop: ShoppingBag,
  profile: User
} satisfies Record<string, LucideIcon>;

export const MOBILE_NAV_ICON_MAP: Record<
  | 'Explore'
  | 'Activities'
  | 'Trips'
  | 'Community'
  | 'Shop'
  | 'Profile'
  | 'Trail catalog'
  | 'Upcoming Activities'
  | 'Upcoming Trips'
  | 'Gears Shop'
  | 'Explore Map'
  | 'My Profile'
  | 'My trips'
  | 'Notifications'
  | 'Join'
  | 'Contact',
  LucideIcon
> = {
  'Explore Map': NAV_ICONS.explore,
  Explore: NAV_ICONS.explore,
  Join: NAV_ICONS.trips,
  Contact: MessageCircle,
  Activities: NAV_ICONS.trips,
  Trips: NAV_ICONS.trips,
  Community: NAV_ICONS.community,
  Shop: NAV_ICONS.shop,
  Profile: NAV_ICONS.profile,
  'My Profile': NAV_ICONS.profile,
  Notifications: Bell,
  'Trail catalog': Map,
  'My trips': NAV_ICONS.trips,
  'Upcoming Activities': NAV_ICONS.trips,
  'Upcoming Trips': NAV_ICONS.trips,
  'Gears Shop': NAV_ICONS.shop,
};

/** Consistent stroke for outline icons in consumer UI */
export const iconStroke = {
  default: 2,
  active: 2.25
} as const;
