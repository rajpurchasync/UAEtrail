export type FounderProfileKey = 'founder' | 'cofounder';

export interface FounderProfile {
  tabLabel: string;
  name: string;
  role: string;
  originPlace: string;
  originDetail: string;
  story: string;
  quote: string;
  initials: string;
}

export const FOUNDERS_STORY_INTRO =
  "We didn't set out to build another app. We wanted one place for anyone in the UAE & GCC to find their outdoor crew — discover what's on, connect, and go together.";

export const FOUNDERS_MISSION_PILLARS = [
  { label: 'Find activities', detail: 'Discover hikes, camps, and events near you' },
  { label: 'Organize outings', detail: 'Share routes you know and grow your crew' },
  { label: 'Build community', detail: 'Connect with hikers across the Emirates' },
] as const;

export const FOUNDER_PROFILES: Record<FounderProfileKey, FounderProfile> = {
  founder: {
    tabLabel: 'Founder',
    name: 'Raj',
    role: 'Founder',
    originPlace: 'From Nepal',
    originDetail: 'Hiking in the UAE since 2015',
    initials: 'R',
    quote: 'The trails changed my weekends. We built UAE Trail so more people could find their crew.',
    story:
      "I've been hiking and camping across the UAE for years: wadis, dam loops, desert overnights, and everything in between. I kept meeting people who wanted to get outdoors but didn't know where to start or who to go with. UAE Trail makes that easier. Find what's on, organize your own outing, and grow the community that got me hooked on these hills.",
  },
  cofounder: {
    tabLabel: 'Co-founder',
    name: 'Husnain Ashfaq',
    role: 'Co-founder',
    originPlace: 'From Pakistan',
    originDetail: 'Enthusiast hiker and leader in the UAE since 2019',
    initials: 'HA',
    quote:
      'Leading hikes and building communities since 2019 — I kept feeling the same gap: the UAE needed UAE Trail to run outdoor plans properly.',
    story:
      "I've spent years hiking, trail running, and leading teams on routes across the UAE, from group treks to organised trail runs. The passion was always there. What was missing was one place to discover activities and connect with organizers you could trust. That's why Raj and I launched UAE Trail, to support the hikers and runners who keep this scene alive.",
  },
};

export const FOUNDER_PROFILE_SEGMENTS = (Object.keys(FOUNDER_PROFILES) as FounderProfileKey[]).map((key) => ({
  key,
  label: FOUNDER_PROFILES[key].tabLabel,
}));

export const FOUNDER_PROFILE_KEYS: FounderProfileKey[] = ['founder', 'cofounder'];
