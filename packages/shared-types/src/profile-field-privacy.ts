import type { FindCrewViewerRelation } from './find-crew-visibility.js';
import type { ProfileDetailExposure } from './profile-viewer-access.js';

/** Per-field visibility on the member card — friends = trusted; FoF = network one hop out. */
export const PROFILE_FIELD_AUDIENCES = [
  'hidden',
  'friends',
  'friends_of_friends',
  'public',
] as const;
export type ProfileFieldAudience = (typeof PROFILE_FIELD_AUDIENCES)[number];

export const PROFILE_FIELD_PRIVACY_KEYS = [
  'bio',
  'city',
  'languages',
  'stats',
  'badges',
  'tripHistory',
  'yearGoal',
  'availability',
  'upcomingActivities',
  'vehicles',
  'vehiclePlate',
] as const;

export type ProfileFieldPrivacyKey = (typeof PROFILE_FIELD_PRIVACY_KEYS)[number];

export type ProfileFieldPrivacySettings = Record<ProfileFieldPrivacyKey, ProfileFieldAudience>;

/** Conservative defaults — sensitive blocks stay hidden until the member opens them. */
export const DEFAULT_PROFILE_FIELD_PRIVACY: ProfileFieldPrivacySettings = {
  bio: 'public',
  city: 'friends',
  languages: 'public',
  stats: 'friends',
  badges: 'friends',
  tripHistory: 'hidden',
  yearGoal: 'hidden',
  availability: 'hidden',
  upcomingActivities: 'friends',
  vehicles: 'hidden',
  vehiclePlate: 'hidden',
};

export const mergeProfileFieldPrivacy = (
  stored: Partial<ProfileFieldPrivacySettings> | null | undefined
): ProfileFieldPrivacySettings => {
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_PROFILE_FIELD_PRIVACY };
  }
  const merged = { ...DEFAULT_PROFILE_FIELD_PRIVACY };
  for (const key of PROFILE_FIELD_PRIVACY_KEYS) {
    const value = stored[key];
    if (value && (PROFILE_FIELD_AUDIENCES as readonly string[]).includes(value)) {
      merged[key] = value;
    }
  }
  // Legacy `age` audience removed — migrated via `mergeProfileDateOfBirthShare`.
  return merged;
};

export type ProfileFieldPrivacyPatch = Partial<ProfileFieldPrivacySettings>;

/**
 * Whether a viewer may see a profile field.
 * Pass `relation` whenever friends_of_friends must be honored (FoF is not profile `full` exposure).
 */
export const canViewProfileField = (
  audience: ProfileFieldAudience,
  exposure: ProfileDetailExposure,
  isSelf: boolean,
  relation: FindCrewViewerRelation | null = null
): boolean => {
  if (isSelf || relation === 'self') return true;
  if (audience === 'hidden') return false;
  if (audience === 'friends') {
    return exposure === 'full' || relation === 'friend';
  }
  if (audience === 'friends_of_friends') {
    return (
      exposure === 'full' ||
      relation === 'friend' ||
      relation === 'friend_of_friend'
    );
  }
  return exposure === 'public' || exposure === 'full';
};
