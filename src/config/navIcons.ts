import {
  Compass,
  Map,
  MessageCircle,
  ShoppingBag,
  User,
  type LucideIcon
} from 'lucide-react';

/** Shared outline icons for mobile nav + participant UI (keep in sync with MOBILE_NAV). */
export const NAV_ICONS = {
  explore: Map,
  trips: Compass,
  community: MessageCircle,
  shop: ShoppingBag,
  profile: User
} satisfies Record<string, LucideIcon>;

export const MOBILE_NAV_ICON_MAP: Record<
  'Explore' | 'Trips' | 'Community' | 'Shop' | 'Profile',
  LucideIcon
> = {
  Explore: NAV_ICONS.explore,
  Trips: NAV_ICONS.trips,
  Community: NAV_ICONS.community,
  Shop: NAV_ICONS.shop,
  Profile: NAV_ICONS.profile
};

/** Consistent stroke for outline icons in consumer UI */
export const iconStroke = {
  default: 2,
  active: 2.25
} as const;
