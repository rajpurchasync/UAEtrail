/** Marketing landing — visitors convert here; members live on map + profile. */

export const HOME_HERO_SUBLINE =
  'Browse the map, join an activity, and meet people who actually show up.';

export const HOME_HERO_JOIN_PROMPT = 'New here?';
export const HOME_HERO_JOIN_CTA = 'Join the community';

export const HOME_PROOF_PILLS = [
  { label: 'Map-first discovery', emoji: '🗺️' },
  { label: 'All 7 emirates', emoji: '🇦🇪' },
  { label: 'Free to join', emoji: '✓' },
] as const;

export const HOME_PRODUCT_PREVIEW = {
  title: 'See what\'s on near you',
  subtitle: 'Trails, camps, and group outings on one map.',
  activityTitle: 'Jebel Jais sunrise hike',
  activityMeta: 'Sat · RAK · Host approved',
  activitySpots: '4 spots left',
} as const;

export type HomeLandingActivity = {
  id: string;
  title: string;
  region: string;
  date: string;
  activityType: 'hiking' | 'camping' | 'event' | 'carpool';
  slotsAvailable: number;
  path: string;
};

/** Curated fallback when public API is empty or unavailable. */
export const HOME_LANDING_FALLBACK_ACTIVITIES: HomeLandingActivity[] = [
  {
    id: 'fallback-jais',
    title: 'Jebel Jais sunrise hike',
    region: 'RAK',
    date: 'Sat',
    activityType: 'hiking',
    slotsAvailable: 4,
    path: '/explore',
  },
  {
    id: 'fallback-wadi',
    title: 'Wadi Shawka family camp',
    region: 'RAK',
    date: 'Fri',
    activityType: 'camping',
    slotsAvailable: 6,
    path: '/explore',
  },
  {
    id: 'fallback-dam',
    title: 'Hatta dam loop',
    region: 'Dubai',
    date: 'Sun',
    activityType: 'hiking',
    slotsAvailable: 8,
    path: '/explore',
  },
];

export const HOME_LIVE_SECTION = {
  title: 'This week on the map',
  subtitle: 'Real group hikes and camps you can request to join.',
} as const;

/** Product story — what the app feels like, not an onboarding checklist. */
export const HOME_DAY_TIMELINE = [
  {
    emoji: '📍',
    time: 'Open the map',
    title: 'See what\'s on',
    detail: 'Trails, camps, and group outings near you — this week.',
  },
  {
    emoji: '✋',
    time: 'Tap to join',
    title: 'Request a spot',
    detail: 'Hosts approve requests. Chat to confirm plans.',
  },
  {
    emoji: '🥾',
    time: 'Show up',
    title: 'Hike with a crew',
    detail: 'Meet outdoors. No more guessing who\'s going.',
  },
] as const;

export const HOME_TESTIMONIALS = [
  {
    name: 'Fatima Al Mazrouei',
    location: 'Dubai',
    rating: 5,
    text: 'Found a Jebel Jais group in minutes. The host was organised and welcoming.',
  },
  {
    name: 'James Mitchell',
    location: 'Abu Dhabi',
    rating: 5,
    text: 'Finally a way to find family-friendly camps without WhatsApp chaos.',
  },
  {
    name: 'Sara Ahmed',
    location: 'RAK',
    rating: 5,
    text: 'My first solo hike felt safe because the activity had a clear host and group.',
  },
  {
    name: 'Mohammed Al Hashmi',
    location: 'Sharjah',
    rating: 5,
    text: 'Made friends I still hike with every month. The map makes it easy.',
  },
] as const;

export const HOME_CLOSE_HEADLINE = "You don't have to find trail buddies alone.";
export const HOME_CLOSE_SUBLINE = 'Join free. Browse the map. Request your first activity.';

export const HOME_FOUNDER_SECTION = {
  title: 'Built by hikers in the UAE',
  subtitle: 'We use this app on the same trails you will.',
} as const;

/** Initials avatar for testimonial cards — avoids stock photo trust issues. */
export const testimonialInitials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
