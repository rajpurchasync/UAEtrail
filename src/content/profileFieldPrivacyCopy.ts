import type {
  ProfileDateOfBirthShare,
  ProfileFieldAudience,
  ProfileFieldPrivacyKey,
  ProfileFriendsListShare,
} from '@uaetrail/shared-types';

export const PROFILE_FRIENDS_LIST_SHARE_LABELS: Record<ProfileFriendsListShare, string> = {
  only_me: 'Only me',
  friends_crew: 'Friends & crew',
  mutual_only: 'Mutual friends',
};

export const PROFILE_FRIENDS_LIST_SHARE_HINT =
  'Who can see your friends list on your public member profile. Accounts you both follow are always shown to signed-in visitors.';

export const PROFILE_FIELD_AUDIENCE_LABELS: Record<ProfileFieldAudience, string> = {
  hidden: 'Only me',
  friends: 'Friends & crew',
  public: 'All signed-in members',
};

export const PROFILE_DATE_OF_BIRTH_SHARE_LABELS: Record<ProfileDateOfBirthShare, string> = {
  hidden: 'Hidden on card',
  year_friends: 'Birth year · friends & crew',
  year_public: 'Birth year · all members',
  full_friends: 'Full date · friends & crew',
  full_public: 'Full date · all members',
};

export const PROFILE_DATE_OF_BIRTH_SHARE_HINT =
  'Hosts may still see gender and date of birth when an outing has women-only or age rules — that is separate from your card settings.';

export const PROFILE_FIELD_PRIVACY_GROUPS: Array<{
  title: string;
  rows: Array<{
    key: ProfileFieldPrivacyKey;
    label: string;
    hint: string;
  }>;
}> = [
  {
    title: 'About you',
    rows: [
      { key: 'bio', label: 'About you', hint: 'Bio on your member card' },
      { key: 'city', label: 'City / emirate', hint: 'Where you are based' },
      { key: 'languages', label: 'Languages', hint: 'Languages you speak' },
    ],
  },
  {
    title: 'Activity & trust',
    rows: [
      { key: 'stats', label: 'Activity counts', hint: 'Joined and hosted totals' },
      { key: 'badges', label: 'Badges', hint: 'System-earned badges and progress' },
      { key: 'tripHistory', label: 'Trip history', hint: 'Past hosted outings on your card' },
      { key: 'yearGoal', label: 'Year goal', hint: 'Your annual outdoors goal' },
      { key: 'availability', label: 'Open to go', hint: 'When you are free to join outings' },
      { key: 'upcomingActivities', label: 'Upcoming outings', hint: 'What you are hosting soon' },
    ],
  },
  {
    title: 'Cars',
    rows: [
      { key: 'vehicles', label: 'My cars', hint: 'Make, model, color, and year' },
      { key: 'vehiclePlate', label: 'Number plates', hint: 'Only applies when cars are visible' },
    ],
  },
];
