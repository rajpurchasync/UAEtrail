import type {
  FindCrewVisibility,
  ProfileDateOfBirthShare,
  ProfileFieldAudience,
  ProfileFieldPrivacyKey,
  ProfileFriendsListShare,
} from '@uaetrail/shared-types';

export const PROFILE_FRIENDS_LIST_SHARE_LABELS: Record<ProfileFriendsListShare, string> = {
  only_me: 'Only me',
  friends_crew: 'Friends & crew',
  friends_of_friends: 'Friends of friends',
  mutual_only: 'Mutual friends',
};

export const PROFILE_FRIENDS_LIST_SHARE_HINT =
  'Who can see your friends list on your public member profile. Mutual friends shows people you share; friends of friends includes one hop through your network. Accounts you both follow are always shown to signed-in visitors.';

export const FIND_CREW_VISIBILITY_LABELS: Record<FindCrewVisibility, string> = {
  friends: 'Friends only',
  friends_of_friends: 'Friends of friends',
  none: 'Hidden from Find crew',
};

export const FIND_CREW_VISIBILITY_HINT =
  'Who can find you under Find crew (Looking, Free, Everyone) and as a seeking pin on the map. Outings you join still show you to that crew.';

export const PROFILE_FIELD_AUDIENCE_LABELS: Record<ProfileFieldAudience, string> = {
  hidden: 'Only me',
  friends: 'Friends & crew',
  friends_of_friends: 'Friends of friends',
  public: 'All signed-in members',
};

export const PROFILE_DATE_OF_BIRTH_SHARE_LABELS: Record<ProfileDateOfBirthShare, string> = {
  hidden: 'Hidden on card',
  month_day_friends: 'Day + month · friends & crew',
  month_day_friends_of_friends: 'Day + month · friends of friends',
  month_day_public: 'Day + month · all members',
  full_friends: 'Full date · friends & crew',
  full_friends_of_friends: 'Full date · friends of friends',
  full_public: 'Full date · all members',
};

export const PROFILE_DATE_OF_BIRTH_SHARE_HINT =
  'Day + month hides your birth year. Hosts may still see your full date when an outing has age rules — that is separate from your card settings.';

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
      {
        key: 'city',
        label: 'City / emirate / start area',
        hint: 'Home base on your card and Find crew area matching. Hidden = not searchable by location; others will not see you as going from their area.',
      },
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
