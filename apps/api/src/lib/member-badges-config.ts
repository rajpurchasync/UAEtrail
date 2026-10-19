/** Member achievement badges — no Trail Points / tier wallet. */

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
}

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

export const MEMBER_BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: 'newbie', name: 'Newbie', description: 'Signed-in member', emoji: '🌱' },
  { key: 'active', name: 'Active', description: 'Join a trip or activity', emoji: '⚡' },
  { key: 'host', name: 'Host', description: 'Host an outing', emoji: '🏔️' },
  {
    key: 'helpful_critic',
    name: 'Helpful Critic',
    description: 'Write a review',
    emoji: '✍️',
  },
  { key: 'goat', name: 'GOAT', description: 'Join 5 trips', emoji: '🐐' },
  { key: 'ambassador', name: 'Ambassador', description: 'Invite 3 friends', emoji: '🎁' },
  { key: 'contributor', name: 'Contributor', description: 'Add a spot', emoji: '📍' },
  {
    key: 'trusted_host',
    name: 'Trusted Host',
    description: 'Host 5 outings',
    emoji: '⭐',
  },
];
