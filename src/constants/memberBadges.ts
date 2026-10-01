/** Display order — keep in sync with apps/api/src/lib/rewards-config.ts MEMBER_BADGE_ORDER */
export const MEMBER_BADGE_ORDER = [
  'newbie',
  'active',
  'host',
  'helpful_critic',
  'goat',
  'ambassador',
  'contributor',
  'trusted_host',
] as const;

export type MemberBadgeKey = (typeof MEMBER_BADGE_ORDER)[number];

export const sortBadgesByCatalogOrder = <T extends { key: string }>(badges: T[]): T[] => {
  const rank = new Map<string, number>(MEMBER_BADGE_ORDER.map((key, index) => [key, index]));
  return [...badges].sort((a, b) => (rank.get(a.key) ?? 99) - (rank.get(b.key) ?? 99));
};
