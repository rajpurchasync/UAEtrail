/**
 * Consumer surface paths (secondary hubs, profile, legacy aliases).
 * No imports — safe for platform.ts and routingCatalog.
 *
 * @see docs/NAVIGATION.md · docs/DOMAIN_CANONICALS.md
 */

/** Personal hub */
export const PROFILE_PATH = '/profile' as const;

/** Member achievement badges (no Trail Points wallet) */
export const PROFILE_BADGES_PATH = '/profile/badges' as const;

/** Community Q&A / reports (desktop; mobile redirects away) */
export const COMMUNITY_PATH = '/community' as const;

/** Legacy membership marketing — redirects to explore (`Membership.tsx`) */
export const MEMBERSHIP_MARKETING_PATH = '/membership' as const;

/** Social subgraph */
export const GROUPS_PATH = '/groups' as const;
export const BUDDIES_PATH = '/buddies' as const;
export const CONTRIBUTIONS_PATH = '/contributions' as const;

/** Removed Trail Points wallet — legacy URLs redirect to badges in `App.tsx` */
export const LEGACY_TRAIL_POINTS_PATH = '/trail-points' as const;
export const LEGACY_MY_REWARDS_PATH = '/my-rewards' as const;
export const LEGACY_REWARDS_PATH = '/rewards' as const;

export const isLegacyRewardsWalletPath = (pathname: string): boolean =>
  pathname === LEGACY_MY_REWARDS_PATH ||
  pathname === LEGACY_REWARDS_PATH ||
  pathname === LEGACY_TRAIL_POINTS_PATH ||
  pathname.startsWith(`${LEGACY_TRAIL_POINTS_PATH}?`);
