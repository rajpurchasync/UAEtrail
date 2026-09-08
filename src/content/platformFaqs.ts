export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  id: string;
  title: string;
  description?: string;
  items: FaqItem[];
}

/** Platform-wide FAQs — surfaced on /faq and FAQPage JSON-LD */
export const PLATFORM_FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'platform',
    title: 'About UAE Trail',
    description: 'What we are and who the platform is for.',
    items: [
      {
        question: 'What is UAE Trail?',
        answer:
          'UAE Trail is an outdoor recreation platform for the United Arab Emirates and the wider GCC. We help you discover hiking trails and camping spots, join organized trips with verified hosts, earn Trail Points rewards, and connect with the outdoor community.'
      },
      {
        question: 'Which regions does UAE Trail cover?',
        answer:
          'We focus on the UAE — all seven emirates including Dubai, Abu Dhabi, Ras Al Khaimah, Fujairah, Sharjah, Ajman, and Umm Al Quwain — with growing coverage in Saudi Arabia, Oman, Qatar, Bahrain, and Kuwait.'
      },
      {
        question: 'Is UAE Trail free to use?',
        answer:
          'Creating an account and browsing trails, camps, and trips is free. Some location premium guides require payment or Trail Points. Organized trips may be free or paid depending on the host.'
      }
    ]
  },
  {
    id: 'trails-trips',
    title: 'Trails, camps & trips',
    description: 'Finding places and joining adventures.',
    items: [
      {
        question: 'How do I find hiking trails and camping spots in the UAE?',
        answer:
          'Open Discovery to browse trails and camps on a map or list. Filter by emirate, difficulty, distance, and activity type. Each location page includes description, photos, difficulty, and upcoming organized trips.'
      },
      {
        question: 'How do I join an organized hike or camping trip?',
        answer:
          'Browse Trips for upcoming events hosted by guides and outdoor businesses. Open a trip page and submit a join request. The host reviews your request and confirms or waitlists you. Track status under My Requests.'
      },
      {
        question: 'What is the difference between a trail page and a trip?',
        answer:
          'A trail or camp page describes a location — route, terrain, access, and tips. A trip is a scheduled event at that location on a specific date, hosted by an organizer with a set capacity and meeting point.'
      },
      {
        question: 'When is the best time to hike in the UAE?',
        answer:
          'The main hiking season runs from October through April when temperatures are cooler. Summer hikes are possible only in the early morning in higher elevations such as Jebel Jais or Hatta. Always check weather and carry enough water.'
      }
    ]
  },
  {
    id: 'hosts',
    title: 'Hosts & organizers',
    items: [
      {
        question: 'How do I become a trip host on UAE Trail?',
        answer:
          'Apply at Become a Host as an individual guide or registered outdoor business. Once approved, you can publish trips, manage join requests, and build a public organizer profile with reviews and certificates.'
      },
      {
        question: 'Are trip hosts verified?',
        answer:
          'Organizer applications are reviewed by our team. Public profiles show host bio, experience, team members, and community reviews so participants can make informed choices before joining.'
      }
    ]
  },
  {
    id: 'rewards',
    title: 'Trail Points & rewards',
    items: [
      {
        question: 'What are Trail Points?',
        answer:
          'Trail Points are rewards for participating on UAE Trail — joining trips, writing reviews, posting in the community, submitting locations, and inviting friends. Points contribute to membership tiers and unlock perks over time.'
      },
      {
        question: 'Where can I learn more about earning Trail Points?',
        answer:
          'Visit the Trail Points page for a full breakdown of earn opportunities, tier levels, and how rewards work on the platform.'
      }
    ]
  },
  {
    id: 'safety',
    title: 'Safety & preparation',
    items: [
      {
        question: 'What should I bring on a UAE hike?',
        answer:
          'At minimum: 2–3 litres of water per person, sun protection (hat, sunscreen, sunglasses), sturdy closed shoes, a fully charged phone, and a basic first-aid kit. Trip pages list host-specific requirements — read them before you go.'
      },
      {
        question: 'Is it safe to hike alone in the UAE?',
        answer:
          'We recommend joining organized trips or hiking with a group, especially in remote wadis and mountains. Tell someone your route and expected return time, download offline maps where available, and avoid hiking in peak summer heat.'
      }
    ]
  },
  {
    id: 'support',
    title: 'Account & support',
    items: [
      {
        question: 'How do I contact UAE Trail support?',
        answer:
          'Email support@uaetrail.com for account, trip, or safety questions. For privacy-related requests, contact privacy@uaetrail.com.'
      },
      {
        question: 'How do I delete my account or update my profile?',
        answer:
          'Sign in and open Profile to update your display name, photo, and preferences. To delete your account, scroll to Delete account at the bottom of Profile. For other data requests, email privacy@uaetrail.com.'
      }
    ]
  }
];

const PLATFORM_FAQ_ITEMS: FaqItem[] = PLATFORM_FAQ_SECTIONS.flatMap((section) => section.items);

const pickFaqs = (...questions: string[]) =>
  PLATFORM_FAQ_ITEMS.filter((item) => questions.includes(item.question));

/** Home page teaser — canonical full list and FAQPage JSON-LD live on /faq */
export const HOME_FAQ_PREVIEW = pickFaqs(
  'What is UAE Trail?',
  'How do I find hiking trails and camping spots in the UAE?',
  'How do I join an organized hike or camping trip?',
  'Is UAE Trail free to use?'
);
