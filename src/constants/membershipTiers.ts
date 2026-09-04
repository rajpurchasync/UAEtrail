/** Trail Points tiers & earn rates — keep in sync with apps/api/src/lib/rewards-config.ts */
export const MEMBERSHIP_TIERS = [
  {
    key: 'active',
    name: 'Active',
    minPoints: 100,
    emoji: '⚡',
    tagline: 'The community sees you',
    benefits: [
      'Active member badge on your profile',
      'Priority visibility in the community',
      'Unlock the path to Pro & GOAT tiers',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    minPoints: 500,
    emoji: '🛡️',
    tagline: 'Trusted on every trail',
    benefits: [
      'Trusted member badge',
      'Free hike invites each month',
      'Early access to select community trips',
    ],
  },
  {
    key: 'goat',
    name: 'GOAT',
    minPoints: 2000,
    emoji: '🐐',
    tagline: 'Greatest Of All Trails',
    benefits: [
      'GOAT badge — top contributor status',
      'Full premium membership benefits',
      'Exclusive trails, offline maps & gear discounts',
    ],
  },
] as const;

export const EARN_WAYS = [
  {
    title: 'Welcome bonus',
    hook: 'Your first step into the community',
    description: 'Create your account and land your first points before your first hike.',
    pointsLabel: '+25',
    ctaLabel: 'Create account',
    ctaPath: '/signup',
  },
  {
    title: 'Invite a friend',
    hook: 'Grow the crew, grow your balance',
    description: 'Share your link — when they join, you both win.',
    pointsLabel: '+50',
    ctaLabel: 'Get invite link',
    ctaPath: '/my-rewards',
    authRequired: true,
  },
  {
    title: 'Submit a location',
    hook: 'Put hidden gems on the map',
    description: 'Know a trail or camp others should discover? Submit it for the community.',
    pointsLabel: '+15 → +100',
    ctaLabel: 'Explore & submit',
    ctaPath: '/discovery',
  },
  {
    title: 'Host a trip',
    hook: 'Lead the adventure',
    description: 'Publish a community trip and check in guests on the day.',
    pointsLabel: '+50 → +125',
    ctaLabel: 'Become a host',
    ctaPath: '/become-host',
  },
  {
    title: 'Join a trip',
    hook: 'Show up. Get checked in.',
    description: 'Book a community trip — your host confirms attendance and points hit your wallet.',
    pointsLabel: '+30',
    ctaLabel: 'Browse trips',
    ctaPath: '/activities',
  },
  {
    title: 'Community post',
    hook: 'Share the story behind the summit',
    description: 'Trip reports, tips, photos, and questions — your voice builds the community.',
    pointsLabel: '+20',
    ctaLabel: 'Write a post',
    ctaPath: '/community',
  },
  {
    title: 'Help someone out',
    hook: 'A quick reply goes a long way',
    description: 'Answer a question or share advice — small acts, steady points.',
    pointsLabel: '+5',
    ctaLabel: 'Join the conversation',
    ctaPath: '/community',
  },
  {
    title: 'Write a review',
    hook: 'Your honest take helps the next explorer',
    description: 'Rate a trail, camp, or host after you’ve been there.',
    pointsLabel: '+25',
    ctaLabel: 'Find a place to review',
    ctaPath: '/discovery',
  },
] as const;

export const getTierByKey = (key: string) =>
  MEMBERSHIP_TIERS.find((t) => t.key === key) ?? MEMBERSHIP_TIERS[0];

/** Paid subscription plans — /membership pricing (Active is free, Pro & GOAT are paid). */
export const SUBSCRIPTION_PLANS = [
  {
    key: 'active',
    name: 'Active',
    emoji: '⚡',
    tagline: 'Start exploring — pay only when you need a guide',
    price: 0,
    priceLabel: 'Free',
    priceSuffix: '',
    priceNote: 'Pay-as-you-go per location',
    popular: false,
    benefits: [
      'Browse trails, camps & community trips',
      'Join free events',
      'Pay-as-you-go location guides',
      'Download map + guide on call, per location',
      'Earn Trail Points on every contribution',
    ],
    ctaLabel: 'Get started free',
    ctaPath: '/discovery',
    ctaExternal: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    emoji: '🛡️',
    tagline: 'For regular explorers who want the full toolkit',
    price: 99,
    priceLabel: 'AED 99',
    priceSuffix: '/month',
    priceNote: 'or AED 999/year (save 16%)',
    popular: true,
    benefits: [
      'Everything in Active',
      'Unlimited offline map downloads',
      'Access location guides included per plan',
      'Partner discounts on gear & experiences',
      'Pro badge on your profile',
    ],
    ctaLabel: 'Upgrade to Pro',
    ctaPath: '/membership',
    ctaExternal: false,
  },
  {
    key: 'goat',
    name: 'GOAT',
    emoji: '🐐',
    tagline: 'Greatest Of All Trails — the full adventure package',
    price: 499,
    priceLabel: 'AED 499',
    priceSuffix: '/month',
    priceNote: 'Ultimate outdoor membership',
    popular: false,
    benefits: [
      'Everything in Pro',
      '5 free guided hikes every month',
      'Unlimited offline map downloads',
      'Personal guide on call',
      'Free access to the full library of location guides',
      'GOAT badge — top member status',
    ],
    ctaLabel: 'Go GOAT',
    ctaPath: '/membership',
    ctaExternal: false,
  },
] as const;

export const getSubscriptionPlan = (key: string) =>
  SUBSCRIPTION_PLANS.find((p) => p.key === key) ?? SUBSCRIPTION_PLANS[0];
