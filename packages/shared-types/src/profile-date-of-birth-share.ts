import type { FindCrewViewerRelation } from './find-crew-visibility.js';
import type { ProfileDetailExposure } from './profile-viewer-access.js';

/** How much of date of birth to show on the member card (not host join disclosure). */
export const PROFILE_DATE_OF_BIRTH_SHARE_LEVELS = [
  'hidden',
  'month_day_friends',
  'month_day_friends_of_friends',
  'month_day_public',
  'full_friends',
  'full_friends_of_friends',
  'full_public',
] as const;

export type ProfileDateOfBirthShare = (typeof PROFILE_DATE_OF_BIRTH_SHARE_LEVELS)[number];

export const DEFAULT_PROFILE_DATE_OF_BIRTH_SHARE: ProfileDateOfBirthShare = 'hidden';

/** Retired `year_*` levels → day+month equivalents (no year/age on the card). */
const LEGACY_YEAR_SHARE_MAP: Record<string, ProfileDateOfBirthShare> = {
  year_friends: 'month_day_friends',
  year_friends_of_friends: 'month_day_friends_of_friends',
  year_public: 'month_day_public',
};

export const mergeProfileDateOfBirthShare = (
  stored: unknown,
  legacyAgeAudience?: 'hidden' | 'friends' | 'public' | null
): ProfileDateOfBirthShare => {
  if (typeof stored === 'string') {
    if ((PROFILE_DATE_OF_BIRTH_SHARE_LEVELS as readonly string[]).includes(stored)) {
      return stored as ProfileDateOfBirthShare;
    }
    const migrated = LEGACY_YEAR_SHARE_MAP[stored];
    if (migrated) return migrated;
  }
  if (legacyAgeAudience === 'hidden') return 'hidden';
  if (legacyAgeAudience === 'friends') return 'month_day_friends';
  if (legacyAgeAudience === 'public') return 'month_day_public';
  return DEFAULT_PROFILE_DATE_OF_BIRTH_SHARE;
};

export const computeAgeFromIsoDateOfBirth = (dateOfBirth: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

/** `MM-DD` fragment from an ISO date of birth. */
export const monthDayFromIsoDateOfBirth = (dateOfBirth: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  return dateOfBirth.slice(5, 10);
};

/** Display "1 June" from `MM-DD` (en-GB day + month, no year). */
export const formatProfileMonthDayLabel = (monthDay: string): string | null => {
  if (!/^\d{2}-\d{2}$/.test(monthDay)) return null;
  const probe = new Date(`2000-${monthDay}T00:00:00`);
  if (Number.isNaN(probe.getTime())) return null;
  return probe.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
};

export type MemberCardDateOfBirthSlice = {
  /** Full ISO date when share is full (or self). */
  dateOfBirth: string | null;
  /** `MM-DD` when share is day+month only. */
  monthDay: string | null;
  /** Set with full date / self only — never for day+month share. */
  birthYear: number | null;
  /** Set with full date / self only — never for day+month share. */
  age: number | null;
};

const networkAllowsFriends = (
  exposure: ProfileDetailExposure,
  relation: FindCrewViewerRelation | null | undefined
): boolean => exposure === 'full' || relation === 'friend' || relation === 'self';

const networkAllowsFriendsOfFriends = (
  exposure: ProfileDetailExposure,
  relation: FindCrewViewerRelation | null | undefined
): boolean =>
  networkAllowsFriends(exposure, relation) || relation === 'friend_of_friend';

export const resolveMemberCardDateOfBirth = (input: {
  dateOfBirth: string | null | undefined;
  share: ProfileDateOfBirthShare;
  exposure: ProfileDetailExposure;
  isSelf: boolean;
  relation?: FindCrewViewerRelation | null;
}): MemberCardDateOfBirthSlice => {
  const empty = { dateOfBirth: null, monthDay: null, birthYear: null, age: null };
  const raw = input.dateOfBirth?.trim() ?? '';
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return empty;
  if (input.isSelf) {
    return {
      dateOfBirth: raw,
      monthDay: monthDayFromIsoDateOfBirth(raw),
      birthYear: Number.parseInt(raw.slice(0, 4), 10),
      age: computeAgeFromIsoDateOfBirth(raw),
    };
  }

  const share = input.share;
  if (share === 'hidden') return empty;

  const relation = input.relation ?? null;
  const trusted = networkAllowsFriends(input.exposure, relation);
  const fofOk = networkAllowsFriendsOfFriends(input.exposure, relation);
  const onPublicCard = input.exposure === 'public' || trusted;

  const fullSlice = (): MemberCardDateOfBirthSlice => ({
    dateOfBirth: raw,
    monthDay: monthDayFromIsoDateOfBirth(raw),
    birthYear: Number.parseInt(raw.slice(0, 4), 10),
    age: computeAgeFromIsoDateOfBirth(raw),
  });
  const monthDaySlice = (): MemberCardDateOfBirthSlice => ({
    dateOfBirth: null,
    monthDay: monthDayFromIsoDateOfBirth(raw),
    birthYear: null,
    age: null,
  });

  if (share === 'full_public' && onPublicCard) return fullSlice();
  if (share === 'full_friends_of_friends' && fofOk) return fullSlice();
  if (share === 'full_friends' && trusted) return fullSlice();
  if (share === 'month_day_public' && onPublicCard) return monthDaySlice();
  if (share === 'month_day_friends_of_friends' && fofOk) return monthDaySlice();
  if (share === 'month_day_friends' && trusted) return monthDaySlice();
  return empty;
};
