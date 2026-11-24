import type { ExploreAvailablePersonDTO } from '@uaetrail/shared-types';

/** Local UI preview when the availability index is empty (dev only). */
export const FIND_CREW_DEV_PREVIEW_PEOPLE: ExploreAvailablePersonDTO[] = [
  {
    userId: 'dev-preview-maya',
    displayName: 'Maya Hassan',
    avatarUrl: null,
    kinds: ['hiking', 'camping'],
    region: 'Dubai',
    destinationSlug: 'dubai',
    slots: [
      {
        startDate: '2026-11-26',
        endDate: '2026-11-28',
        capacity: 'participant',
        modalities: ['hiking', 'camping'],
        scheduleKind: 'open',
      },
    ],
    isFriend: false,
  },
  {
    userId: 'dev-preview-fatima',
    displayName: 'Fatima Al Mazrouei',
    avatarUrl: null,
    kinds: ['hiking'],
    region: 'Sharjah',
    destinationSlug: 'sharjah',
    profileRoleLabel: 'professional_guide',
    slots: [
      {
        startDate: '2026-11-27',
        endDate: '2026-11-29',
        capacity: 'guide',
        modalities: ['hiking'],
        scheduleKind: 'open',
        engagementTerms: { pricingKind: 'free', tourShape: 'group' },
      },
    ],
    isFriend: false,
    canOpenMemberProfile: true,
  },
  {
    userId: 'dev-preview-omar',
    displayName: 'Omar Hassan',
    avatarUrl: null,
    kinds: ['hiking'],
    region: 'Ras Al Khaimah',
    destinationSlug: null,
    slots: [
      {
        startDate: '2026-11-24',
        endDate: '2026-11-30',
        capacity: 'participant',
        modalities: ['hiking'],
        scheduleKind: 'open',
      },
    ],
    isFriend: true,
    canOpenMemberProfile: true,
  },
  {
    userId: 'dev-preview-private',
    displayName: 'Sara Khan',
    avatarUrl: null,
    kinds: ['hiking'],
    region: 'Abu Dhabi',
    slots: [
      {
        startDate: '2026-11-25',
        endDate: '2026-11-27',
        capacity: 'participant',
        modalities: ['hiking'],
        scheduleKind: 'open',
      },
    ],
    isFriend: false,
    canOpenMemberProfile: false,
  },
];