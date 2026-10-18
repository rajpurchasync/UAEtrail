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
          'UAE Trail helps you find people to get outside with in the UAE and GCC — hikes, camps, trail runs, jogs, and group outings. Browse what’s on, post what you’re looking for, connect and chat, then go together. Residents, expats, and visitors are all welcome. Free to browse; some activities may be paid depending on the host.'
      },
      {
        question: 'Which regions does UAE Trail cover?',
        answer:
          'We focus on the UAE — all seven emirates including Dubai, Abu Dhabi, Ras Al Khaimah, Fujairah, Sharjah, Ajman, and Umm Al Quwain — with growing coverage in Saudi Arabia, Oman, Qatar, Bahrain, and Kuwait.'
      },
      {
        question: 'Is UAE Trail free to use?',
        answer:
          'Creating an account and browsing the map, trails, camps, and activities is free. Many group outings are free to join. Some plans share costs or charge a per-person price depending on the host — each activity shows Free, Cost shared, or Paid before you join.'
      }
    ]
  },
  {
    id: 'trails-activities',
    title: 'Trails, camps & activities',
    description: 'Finding places and joining adventures.',
    items: [
      {
        question: 'How do I find hiking trails and camping spots in the UAE?',
        answer:
          'Open Explore to browse trails and camps on a map or list. Filter by emirate, difficulty, distance, and activity type. Each venue page includes description, photos, difficulty, and upcoming organized activities.'
      },
      {
        question: 'How do I join an organized hike or camping activity?',
        answer:
          'Open Explore to see outings near you — hikes, camps, runs, and group plans on the map. Tap one, connect with the group, and request to join. Hosts approve who comes along. You can also post what you’re looking for if nothing fits.'
      },
      {
        question: 'What is the difference between a trail page and an activity?',
        answer:
          'A trail or camp page describes a location — route, terrain, access, and tips. An activity is a scheduled event at that location on a specific date, organized by a member or guide with a set capacity and meeting point.'
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
    title: 'Hosts & operators',
    items: [
      {
        question: 'How do I run activities on UAE Trail?',
        answer:
          'Sign up and finish your profile, then use Organize on the map to publish hikes, camps, runs, and group plans. Pro membership is reviewed for professional guides and businesses; public profiles show experience and reviews so participants can choose with confidence. Apply from Profile → Pro membership.'
      },
      {
        question: 'Are activity hosts verified?',
        answer:
          'Pro and operator applications are reviewed by our team. Public profiles show experience, team members, and community reviews so participants can make informed choices before joining.'
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
          'At minimum: 2–3 litres of water per person, sun protection (hat, sunscreen, sunglasses), sturdy closed shoes, a fully charged phone, and a basic first-aid kit. Activity pages list host-specific requirements — read them before you go.'
      },
      {
        question: 'Is it safe to hike alone in the UAE?',
        answer:
          'We recommend joining organized activities or hiking with a group, especially in remote wadis and mountains. Tell someone your route and expected return time, download offline maps where available, and avoid hiking in peak summer heat.'
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
          'Email support@uaetrail.com for account, activity, or safety questions. For privacy-related requests, contact privacy@uaetrail.com.'
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
  'How do I join an organized hike or camping activity?',
  'Is UAE Trail free to use?'
);
