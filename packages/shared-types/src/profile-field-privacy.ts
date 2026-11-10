import type { ProfileDetailExposure } from './profile-viewer-access.js';

/** Per-field visibility on the member card — friends = trusted profile exposure. */
export const PROFILE_FIELD_AUDIENCES = ['hidden', 'friends', 'public'] as const;
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
    if (value && PROFILE_FIELD_AUDIENCES.includes(value)) {
      merged[key] = value;
    }
  }
  // Legacy `age` audience removed — migrated via `mergeProfileDateOfBirthShare`.
  return merged;
};

export type ProfileFieldPrivacyPatch = Partial<ProfileFieldPrivacySettings>;

export const canViewProfileField = (
  audience: ProfileFieldAudience,
  exposure: ProfileDetailExposure,
  isSelf: boolean
): boolean => {
  if (isSelf) return true;
  if (audience === 'hidden') return false;
  if (audience === 'friends') return exposure === 'full';
  return exposure === 'public' || exposure === 'full';
};
