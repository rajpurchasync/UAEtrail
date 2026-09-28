/** Marketing landing — signed-out guests only; members always use /explore. See docs/LANDING.md & docs/NORTHSTAR.md */

export const HOME_HERO_EYEBROW = 'Outdoor community · UAE & GCC';

/** Compact eyebrow for mobile hero — avoids crowded all-caps tracking. */
export const HOME_HERO_EYEBROW_MOBILE = 'UAE & GCC outdoors';

export const HOME_HERO_HEADLINE = 'Find your next hike, camp, or outdoor crew in the UAE';

/** Mobile hero — short, emotional; fits one viewport without wrapping into a wall of text. */
export const HOME_HERO_HEADLINE_MOBILE = 'Find your people. Get outside. Go together.';

export const HOME_HERO_SUBLINE =
  'Discover trails and group outings on a live map, request to join with a verified host, and show up with people who actually follow through.';

/** Shorter hero copy for mobile — outcome first; map/hosts live in sections below. */
export const HOME_HERO_SUBLINE_MOBILE =
  'Find company for hikes, camps, and outdoor plans near you.';

export const HOME_HERO_PRIMARY_CTA = 'Open Map';
/** Desktop hero only — mobile keeps `HOME_HERO_PRIMARY_CTA`. */
export const HOME_HERO_PRIMARY_CTA_DESKTOP = 'View on Map';
export const HOME_HERO_JOIN_CTA = 'Join free';
/** Desktop hero secondary button label (title case). */
export const HOME_HERO_JOIN_CTA_DESKTOP = 'Join Free';

export const HOME_PROOF_STATS = [
  {
    label: 'Verified Hosts',
    detail: 'Every activity has a named host who approves who joins.',
  },
  {
    label: 'Community Driven',
    detail: 'Built by hikers for the UAE outdoor community.',
  },
  {
    label: 'Free to Join',
    detail: 'Browse the map free, then sign up when you’re ready to request a spot.',
  },
] as const;

/** @deprecated Use HOME_PROOF_STATS */
export const HOME_PROOF_PILLS = HOME_PROOF_STATS.map((s) => ({
  label: s.label,
  emoji: '✓',
}));

export const HOME_VALUE_SECTION = {
  eyebrow: 'Why UAE Trail',
  title: 'Find your people. Get outside. Go together.',
  subtitle: 'Less scrolling group chats. More real plans on the map.',
} as const;

export const HOME_VALUE_PROPS = [
  {
    title: 'Real plans on the map',
    tagline: 'Hikes, camps, and runs with date, time, price, and a named host.',
    description:
      'Filter by emirate, read the full plan, then decide — not a vague “we should go sometime”.',
  },
  {
    title: 'Join one or post yours',
    tagline: 'Request to join a plan, or post what you want if nothing fits today.',
    description:
      'The host approves who joins. Group chat opens so you know who you are meeting.',
  },
  {
    title: 'Same crew, next time',
    tagline: 'Buddies and group chat make the next outing one tap away.',
    description:
      'Meet people you want to hike, camp, or run with again — not one-off strangers.',
  },
] as const;

export const HOME_PRODUCT_PREVIEW = {
  title: 'See what’s on before you sign up',
  subtitle:
    'Outings near you on the map — tap a pin, connect with the group, and join when you’re ready.',
  activityTitle: 'Jebel Jais sunrise hike',
  activityMeta: 'Saturday · RAK · Host approved',
  activitySpots: '4 spots left',
} as const;

export type HomeLandingActivity = {
  id: string;
  title: string;
  region: string;
  whenLabel: string;
  activityType: 'hiking' | 'camping' | 'event' | 'carpool';
  price: number;
  pricePackages?: { label: string; amount: number; currency: string }[];
  paymentTerms?: string | null;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  path: string;
};

/** Curated fallback when public API is empty or unavailable. */
export const HOME_LANDING_FALLBACK_ACTIVITIES: HomeLandingActivity[] = [
  {
    id: 'fallback-jais',
    title: 'Jebel Jais sunrise hike',
    region: 'RAK',
    whenLabel: 'Sat at 5:30 AM',
    activityType: 'hiking',
    price: 0,
    pricingMode: 'free',
    path: '/explore',
  },
  {
    id: 'fallback-wadi',
    title: 'Wadi Shawka family camp',
    region: 'RAK',
    whenLabel: 'Fri at 4:00 PM',
    activityType: 'camping',
    price: 45,
    pricingMode: 'shared',
    path: '/explore',
  },
  {
    id: 'fallback-dam',
    title: 'Hatta dam loop',
    region: 'Dubai',
    whenLabel: 'Sun at 7:00 AM',
    activityType: 'hiking',
    price: 120,
    pricingMode: 'paid',
    pricePackages: [{ label: 'Standard', amount: 120, currency: 'AED' }],
    path: '/explore',
  },
];

export const HOME_LIVE_SECTION = {
  title: 'Activities near you',
  subtitle: 'Real group plans posted by hosts and members — join from the map or say what you want.',
  viewAllLabel: 'View all',
} as const;

export const HOME_DAY_TIMELINE = {
  title: 'How it works',
  subtitle: 'Find a plan on the map, connect with the group, get outside.',
  steps: [
    {
      step: '01',
      title: 'Open the map',
      line: 'See hikes, camps, and runs near you — with date, time, and price.',
      detail: 'Filter by emirate, tap a pin, and read the full plan before you commit.',
    },
    {
      step: '02',
      title: 'Join or post yours',
      line: 'Request to join a plan, or post what you’re looking for.',
      detail: 'The host approves who joins. Group chat opens so you can align before go-day.',
    },
    {
      step: '03',
      title: 'Meet up outdoors',
      line: 'Show up on the day with the same people.',
      detail: 'Add buddies and keep the group chat — your next outing is a tap away.',
    },
  ],
} as const;

export const HOME_TESTIMONIALS_SECTION = {
  title: 'People who found their outdoor crew',
  subtitle: 'Real members — not stock photos.',
} as const;

export const HOME_TESTIMONIALS = [
  {
    name: 'Fatima Al Mazrouei',
    location: 'Dubai',
    rating: 5,
    text: 'Found a Jebel Jais group in minutes. The host was organised, the group chat was clear, and everyone showed up on time.',
  },
  {
    name: 'James Mitchell',
    location: 'Abu Dhabi',
    rating: 5,
    text: 'Finally a structured way to find family-friendly camps without endless WhatsApp threads and last-minute cancellations.',
  },
  {
    name: 'Sara Ahmed',
    location: 'RAK',
    rating: 5,
    text: 'My first solo hike felt safe because the activity had a verified host, a clear meeting point, and a visible group list.',
  },
  {
    name: 'Mohammed Al Hashmi',
    location: 'Sharjah',
    rating: 5,
    text: 'I still hike with the same crew I met through UAE Trail six months ago. The map makes it easy to find the next outing.',
  },
] as const;

export const HOME_CLOSE_HEADLINE = 'Ready to get outside with your crew?';
export const HOME_CLOSE_SUBLINE =
  'Browse what’s on, connect with like-minded people, and join your first outing — free to start.';

export const HOME_FOUNDER_SECTION = {
  title: 'Built by people who wanted a crew',
  subtitle:
    'We started UAE Trail because the trails were here — what was missing was one place to find your people and go together.',
} as const;

/** Initials avatar for testimonial cards — avoids stock photo trust issues. */
export const testimonialInitials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
