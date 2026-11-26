import { GUEST_OUTING_SIGN_UP_CTA, PRODUCT_JOIN_CTA, PRODUCT_TAGLINE } from './productNorthStar';
import { EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES } from '@/discovery/discoveryPortExploreGuestWire';
import type { GuestBrowseGateIntent } from './guestBrowseGateCopy';

/** Member-only surfaces — explain the feature, then sign up / log in. */
export type GuestFeatureUnlockKey =
  | 'find-crew'
  | 'join-outing'
  | 'map-peek'
  | 'post-on-map'
  | 'plan'
  | 'member-profile'
  | 'chat'
  | 'friends'
  | 'groups'
  | 'notifications'
  | 'join-requests'
  | 'outing-history'
  | 'badges'
  | 'submissions'
  | 'settings-hub'
  | 'preview-limit'
  | 'geo-places';

export type GuestFeatureUnlockCopy = {
  emoji: string;
  title: string;
  lead: string;
  bullets: readonly string[];
  signUpLabel: string;
};

const COPY: Record<GuestFeatureUnlockKey, GuestFeatureUnlockCopy> = {
  'find-crew': {
    emoji: '🧭',
    title: 'Find your crew',
    lead: 'See who’s free, who’s going, and who wants the same kind of day outside as you.',
    bullets: [
      'Browse members open to get outside',
      'Match availability with real outings',
      'Connect before you leave the city',
    ],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  'join-outing': {
    emoji: '🙌',
    title: 'Join this outing',
    lead: 'Say you’re going, meet the host, and show up with people who actually turn up.',
    bullets: ['Request a spot or RSVP in one tap', 'Chat with your crew before the trail', 'Build a streak of real plans'],
    signUpLabel: GUEST_OUTING_SIGN_UP_CTA,
  },
  'map-peek': {
    emoji: '🗺️',
    title: 'Go deeper on the map',
    lead: 'Save places you love, message hosts, and unlock full details on every plan near you.',
    bullets: ['Full activity and place stories', 'Follow hosts and shops you trust', PRODUCT_TAGLINE],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  'post-on-map': {
    emoji: '✨',
    title: 'Host · Find crew · Add on map',
    lead: 'Publish an outing, post that you’re looking for company, or add a trail, camp, or shop for everyone.',
    bullets: ['Host verified outings', 'Find people for your next hike or camp', 'Contribute spots the community uses'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  plan: {
    emoji: '📅',
    title: 'Your plans hub',
    lead: 'Keep upcoming outings, saved places, and outdoor goals in one calm place.',
    bullets: ['See what’s next on your calendar', 'Wishlist trails and camps', 'Share availability for Find crew'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  'member-profile': {
    emoji: '👋',
    title: 'Member profiles',
    lead: 'Learn who you’ll hike with — experience, vibe, and what they’re into outside.',
    bullets: ['Trusted view of hosts and friends', 'Connect from outings you share', 'Stay in sync before meet-up'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  chat: {
    emoji: '💬',
    title: 'Chat with your crew',
    lead: 'Message hosts, coordinate meet-ups, and keep group threads for outings you share.',
    bullets: ['Direct messages with people you meet on the trail', 'Group chat when you join an outing', 'Stay in sync before you head outside'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  friends: {
    emoji: '🤝',
    title: 'Friends on UAE Trail',
    lead: 'Build your outdoor circle — people you trust for hikes, camps, and weekend plans.',
    bullets: ['See friends who get outside', 'Find plans together faster', 'Grow your crew over time'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  groups: {
    emoji: '👥',
    title: 'Groups',
    lead: 'Stay organized with clubs, regular crews, and outing groups in one place.',
    bullets: ['Group threads and shared plans', 'Invite people you already know', 'Keep repeat outings easy'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  notifications: {
    emoji: '🔔',
    title: 'Notifications',
    lead: 'Never miss a join approval, message, or update on plans you care about.',
    bullets: ['Join request updates', 'Messages and crew activity', 'Reminders before you head out'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  'join-requests': {
    emoji: '📋',
    title: 'Join requests',
    lead: 'Track requests you sent and see when hosts respond — all in one queue.',
    bullets: ['Status on outings you asked to join', 'Withdraw or follow up easily', 'Less flaky back-and-forth'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  'outing-history': {
    emoji: '🥾',
    title: 'Outing history',
    lead: 'Look back at where you’ve been — hosted, joined, and your journey on the map.',
    bullets: ['Past hikes and camps in one list', 'Your map of places you’ve done', 'Proof of time outside'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  badges: {
    emoji: '🏅',
    title: 'Badges',
    lead: 'Celebrate streaks and milestones from real time outdoors with your crew.',
    bullets: ['Earn badges from outings', 'Share wins with friends', 'Motivation to keep going'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  submissions: {
    emoji: '📍',
    title: 'Your submissions',
    lead: 'Trails, camps, and spots you added for the community — track status in one list.',
    bullets: ['Places you contributed', 'Updates when they go live', 'Help others find great spots'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  'settings-hub': {
    emoji: '⚙️',
    title: 'Account & settings',
    lead: 'Privacy, notifications, safety, and how you show up to others on UAE Trail.',
    bullets: ['Control who sees your profile', 'Notification preferences', 'Safety and emergency info'],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  'geo-places': {
    emoji: '🗺️',
    title: 'Places by area',
    lead: 'Browse countries, emirates, and areas with live counts of outings and spots — then drill into what’s happening near you.',
    bullets: [
      'See activities and places rolled up by region',
      'Open emirates and neighborhoods from one tree',
      'Explore scoped lists without losing the map',
    ],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
  'preview-limit': {
    emoji: '🔒',
    title: 'Preview limit reached',
    lead: `You’ve viewed ${EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES} plans on the map this visit. Join free or log in to keep exploring and search again.`,
    bullets: [
      'Open every outing and place on the map',
      'Search activities, trails, and shops',
      PRODUCT_TAGLINE,
    ],
    signUpLabel: PRODUCT_JOIN_CTA,
  },
};

export const guestFeatureUnlockCopy = (key: GuestFeatureUnlockKey): GuestFeatureUnlockCopy => COPY[key];

export const guestBrowseGateIntentToFeatureKey = (
  intent: GuestBrowseGateIntent
): GuestFeatureUnlockKey => {
  switch (intent) {
    case 'plan-hub':
      return 'plan';
    case 'explore-social':
    case 'explore-people-browse':
      return 'find-crew';
    case 'peek-details':
      return 'map-peek';
    case 'preview-limit':
      return 'preview-limit';
    case 'join-activity':
      return 'join-outing';
    case 'member-profile':
      return 'member-profile';
    case 'place-detail':
      return 'geo-places';
  }
};
