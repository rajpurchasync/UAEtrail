/** Marketing landing — signed-out guests only; members always use /explore. See docs/LANDING.md & docs/NORTHSTAR.md */

export const HOME_HERO_EYEBROW = 'Outdoor community · UAE & GCC';

/** Compact eyebrow for mobile hero — avoids crowded all-caps tracking. */
export const HOME_HERO_EYEBROW_MOBILE = 'UAE & GCC · get outside together';

export const HOME_HERO_HEADLINE = 'Find your people for whatever gets you outside in the UAE';

export const HOME_HERO_SUBLINE =
  'Residents, visitors, same vibe — discover outings near you, connect with like-minded people, chat, and go together.';

/** Shorter hero copy for mobile — headline carries the main message. */
export const HOME_HERO_SUBLINE_MOBILE =
  'Hikes, camps, runs, and more — find your crew and get outside together.';

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
  eyebrow: 'What you can do',
  title: 'Find your people. Get outside. Go together.',
  subtitle:
    'See what’s on, say what you want, connect and chat — then show up with a crew that keeps going.',
} as const;

export const HOME_VALUE_PROPS = [
  {
    title: 'See what’s on near you',
    tagline: 'Hikes, camps, runs, and group outings on the map.',
    description:
      'Real plans near you — filter by emirate and date, then tap in when something fits.',
  },
  {
    title: 'Say what you’re looking for',
    tagline: 'Post your plan and find like-minded people.',
    description:
      'Weekend camp, trail run, early jog — connect with others heading out or hosts who can lead.',
  },
  {
    title: 'Connect and go together',
    tagline: 'Chat, meet up, keep the same crew.',
    description:
      'Group chat and buddies make the next outing easy — show up together, stay connected.',
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
  title: 'Outings happening this week',
  subtitle: 'Real group plans posted by hosts and members — join from the map or say what you want.',
} as const;

export const HOME_DAY_TIMELINE = {
  title: 'How it works',
  subtitle: 'From browsing to showing up with your crew.',
  steps: [
    {
      step: '01',
      title: 'Browse what’s on',
      line: 'Outings near you on the map.',
      detail: 'Hikes, camps, runs, and group plans across the UAE — filter and tap in.',
    },
    {
      step: '02',
      title: 'Join or post your plan',
      line: 'Request a spot or say what you want.',
      detail: 'Connect in group chat once you’re in — hosts approve who joins.',
    },
    {
      step: '03',
      title: 'Show up together',
      line: 'Meet your crew outdoors.',
      detail: 'Same people, next outing easier — buddies and group chat keep you going.',
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
