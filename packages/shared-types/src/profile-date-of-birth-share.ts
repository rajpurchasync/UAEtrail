import type { ProfileDetailExposure } from './profile-viewer-access.js';

/** How much of date of birth to show on the member card (not host join disclosure). */
export const PROFILE_DATE_OF_BIRTH_SHARE_LEVELS = [
  'hidden',
  'year_friends',
  'year_public',
  'full_friends',
  'full_public',
] as const;

export type ProfileDateOfBirthShare = (typeof PROFILE_DATE_OF_BIRTH_SHARE_LEVELS)[number];

export const DEFAULT_PROFILE_DATE_OF_BIRTH_SHARE: ProfileDateOfBirthShare = 'hidden';

export const mergeProfileDateOfBirthShare = (
  stored: unknown,
  legacyAgeAudience?: 'hidden' | 'friends' | 'public' | null
): ProfileDateOfBirthShare => {
  if (
    typeof stored === 'string' &&
    (PROFILE_DATE_OF_BIRTH_SHARE_LEVELS as readonly string[]).includes(stored)
  ) {
    return stored as ProfileDateOfBirthShare;
  }
  if (legacyAgeAudience === 'hidden') return 'hidden';
  if (legacyAgeAudience === 'friends') return 'year_friends';
  if (legacyAgeAudience === 'public') return 'year_public';
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

export type MemberCardDateOfBirthSlice = {
  dateOfBirth: string | null;
  birthYear: number | null;
  age: number | null;
};

export const resolveMemberCardDateOfBirth = (input: {
  dateOfBirth: string | null | undefined;
  share: ProfileDateOfBirthShare;
  exposure: ProfileDetailExposure;
  isSelf: boolean;
}): MemberCardDateOfBirthSlice => {
  const empty = { dateOfBirth: null, birthYear: null, age: null };
  const raw = input.dateOfBirth?.trim() ?? '';
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return empty;
  if (input.isSelf) {
    return {
      dateOfBirth: raw,
      birthYear: Number.parseInt(raw.slice(0, 4), 10),
      age: computeAgeFromIsoDateOfBirth(raw),
    };
  }

  const share = input.share;
  if (share === 'hidden') return empty;

  const trusted = input.exposure === 'full';
  const onPublicCard = input.exposure === 'public' || trusted;

  if (share === 'full_public' && onPublicCard) {
    return {
      dateOfBirth: raw,
      birthYear: Number.parseInt(raw.slice(0, 4), 10),
      age: computeAgeFromIsoDateOfBirth(raw),
    };
  }
  if (share === 'full_friends' && trusted) {
    return {
      dateOfBirth: raw,
      birthYear: Number.parseInt(raw.slice(0, 4), 10),
      age: computeAgeFromIsoDateOfBirth(raw),
    };
  }
  if (share === 'year_public' && onPublicCard) {
    const birthYear = Number.parseInt(raw.slice(0, 4), 10);
    return {
      dateOfBirth: null,
      birthYear,
      age: computeAgeFromIsoDateOfBirth(raw),
    };
  }
  if (share === 'year_friends' && trusted) {
    const birthYear = Number.parseInt(raw.slice(0, 4), 10);
    return {
      dateOfBirth: null,
      birthYear,
      age: computeAgeFromIsoDateOfBirth(raw),
    };
  }
  return empty;
};
