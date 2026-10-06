/** Homepage v2 copy — canonical strings from docs/content.md */

import { FOUNDER_PROFILES } from './foundersStory';
import { PRODUCT_EXPLORE_CTA, PRODUCT_JOIN_CTA, PRODUCT_RETRY_LABEL } from './productNorthStar';

export const HOME_HEADER_NAV = {
  map: 'Map',
  login: 'Log in',
  signup: PRODUCT_JOIN_CTA
} as const;

export const HOME_HERO = {
  eyebrow: 'OUTDOOR COMMUNITY · UAE & GCC',
  eyebrowShort: 'UAE & GCC outdoors',
  headline: 'Find your people. Get outside together.',
  subcopy:
    'Hikes, camps, trail runs and group outings across the UAE & GCC — for residents and visitors alike.',
  primaryCta: PRODUCT_EXPLORE_CTA,
  secondaryCta: PRODUCT_JOIN_CTA,
  proofPoints: ['Host-approved groups', 'Residents & visitors', 'Free to join'] as const
} as const;

export const HOME_ACTIVITIES = {
  title: 'Upcoming outings',
  subtitle: 'Real group plans from hosts and members. Pick one and go together.',
  viewAll: 'View all →',
  emptyFilter: (emirate: string) => `No plans in ${emirate} yet. Post one or view all`,
  error: "Couldn't load outings.",
  retry: PRODUCT_RETRY_LABEL,
  priceDefinitions: {
    free: 'No fee to join this activity.',
    shared: 'Host splits shared costs (e.g. fuel, permits); you pay your share.',
    paid: 'Set price per person to join.'
  }
} as const;

export const HOME_HOW_IT_WORKS = {
  title: 'How it works',
  subtitle: 'Find a plan, join the group, get outside.',
  cta: 'Open the map',
  steps: [
    {
      title: 'Open the map',
      description:
        'Filter by emirate, tap a pin, and read the full plan: date, time, price and host.'
    },
    {
      title: 'Join or post yours',
      description:
        "Request a spot and the host approves. A group chat opens so you know who you're meeting. Nothing fits? Post what you want."
    },
    {
      title: 'Meet up outdoors',
      description: 'Add buddies and keep the chat so your next outing is one tap away.'
    }
  ] as const
} as const;

export const HOME_REVIEWS = {
  title: 'People who found their outdoor crew',
  featured: {
    quote:
      'I moved to Dubai solo and kept bailing on weekend hikes. One RAK trip through UAE Trail turned into a regular crew — we still chat before every outing.',
    name: 'Sarah M.',
    emirate: 'Dubai'
  },
  compact: [
    {
      quote:
        'The host approval and group chat meant I knew who I was meeting before I drove to Fujairah. Felt safe and actually fun.',
      name: 'Omar K.',
      emirate: 'Abu Dhabi'
    },
    {
      quote:
        'As a visitor I just wanted one real camp, not a WhatsApp ghost list. Found a Shawka plan in minutes on the map.',
      name: 'Priya N.',
      emirate: 'Sharjah'
    },
    {
      quote:
        'Jebel Jais sunrise with people who actually showed up at 4 AM — that is the whole product for me.',
      name: 'James L.',
      emirate: 'RAK'
    }
  ] as const
} as const;

export const HOME_FAQ = {
  title: 'Common questions',
  allLink: 'All FAQs →',
  items: [
    {
      id: 'what',
      question: 'What is UAE Trail?',
      answer:
        'UAE Trail helps you find people to get outside with in the UAE and GCC — hikes, camps, trail runs, jogs, and group outings. Browse real plans on the map, connect with a group, and go together. Residents, expats, and visitors are all welcome.'
    },
    {
      id: 'free',
      question: 'Is it free to use?',
      answer:
        'Yes. Creating an account and browsing the map is free. Many outings are free to join. Some plans share costs (fuel, permits) or charge a set price per person — each activity shows Free, Cost shared, or Paid before you request a spot.'
    },
    {
      id: 'find',
      question: 'How do I find hikes and camps?',
      answer:
        'Tap Explore the map to open the live map. Filter by emirate, tap a pin, and read the full plan — date, time, host, and price. You can browse scheduled outings and outdoor places across all seven emirates.'
    },
    {
      id: 'join',
      question: 'How do I join an activity?',
      answer:
        'Open a plan on the map and request to join, or tap I\'m going when the host allows open RSVP. The host approves who comes along. Group chat opens once you\'re in so you know who you\'re meeting before you head out.'
    },
    {
      id: 'pricing',
      question: 'What do Free, Cost shared and Paid mean?',
      answer:
        'Free means no fee to join. Cost shared means the host splits shared expenses such as fuel or permits — you pay your share. Paid means a set price per person set by the host, often for guided or professional outings. Tap ⓘ on any activity card for a one-line reminder.'
    },
    {
      id: 'host',
      question: 'Can I host my own activity?',
      answer:
        'Yes. Sign up, finish your profile, then use Organize on the map to post a hike, camp, run, or group plan. Many members host buddy outings in the community. Paid or professional guiding goes through Pro membership in Profile when you\'re ready to publish those plans.'
    }
  ] as const
} as const;

export const HOME_FINAL_CTA = {
  headline: 'Ready to get outside with your crew?',
  subcopy: "Browse what's on, connect with like-minded people, and join your first outing.",
  primaryCta: PRODUCT_EXPLORE_CTA,
  secondaryCta: PRODUCT_JOIN_CTA,
  liveLink: "See what's live this week →",
  founderQuote: 'Built by hikers who wanted a crew.',
  founderName: 'Raj',
  founderRole: 'Founder'
} as const;

/** Guest homepage footer — short lines per founder (footer only). */
export const HOME_FOOTER_FOUNDERS_HEADING = {
  lead: 'Built by people who love the outdoors',
  support: 'For anyone in the UAE & GCC looking for like-minded people'
} as const;

export const HOME_FOOTER_FOUNDERS = [
  {
    name: FOUNDER_PROFILES.founder.name,
    role: FOUNDER_PROFILES.founder.role,
    lines: ['UAE Trail puts real outings on one map — find your people, pick a plan, go together.']
  },
  {
    name: FOUNDER_PROFILES.cofounder.name,
    role: FOUNDER_PROFILES.cofounder.role,
    lines: [FOUNDER_PROFILES.cofounder.quote]
  }
] as const;

export const HOME_EMIRATE_FILTER_ORDER = [
  { id: 'all', label: 'All' },
  { id: 'dubai', label: 'Dubai' },
  { id: 'abu-dhabi', label: 'Abu Dhabi' },
  { id: 'sharjah', label: 'Sharjah' },
  { id: 'rak', label: 'RAK' },
  { id: 'fujairah', label: 'Fujairah' },
  { id: 'ajman', label: 'Ajman' },
  { id: 'uaq', label: 'UAQ' }
] as const;
