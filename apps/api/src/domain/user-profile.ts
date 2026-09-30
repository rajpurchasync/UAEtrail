import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';

export const USER_GENDERS = ['male', 'female', 'prefer_not_to_say'] as const;
export type UserGender = (typeof USER_GENDERS)[number];

export const USER_CITIES = [
  'dubai',
  'sharjah',
  'al_ain',
  'abu_dhabi',
  'ras_al_khaimah',
  'fujairah',
  'ajman',
  'umm_al_quwain',
] as const;
export type UserCity = (typeof USER_CITIES)[number];

export const USER_CITY_LABELS: Record<UserCity, string> = {
  dubai: 'Dubai',
  sharjah: 'Sharjah',
  al_ain: 'Al Ain',
  abu_dhabi: 'Abu Dhabi',
  ras_al_khaimah: 'Ras Al Khaimah',
  fujairah: 'Fujairah',
  ajman: 'Ajman',
  umm_al_quwain: 'Umm Al Quwain',
};

export const USER_GENDER_LABELS: Record<UserGender, string> = {
  male: 'Male',
  female: 'Female',
  prefer_not_to_say: 'Prefer not to say',
};

export const USER_COUNTRY_CODES = ['AE', 'SA', 'OM', 'QA', 'BH', 'KW'] as const;
export type UserCountryCode = (typeof USER_COUNTRY_CODES)[number];

export const USER_COUNTRY_LABELS: Record<UserCountryCode, string> = {
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  OM: 'Oman',
  QA: 'Qatar',
  BH: 'Bahrain',
  KW: 'Kuwait',
};

export const dateOfBirthSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date of birth.');

/** Post-auth `/welcome` gate — languages are edited on profile, not signup. */
export const completeSignupProfileSchema = z.object({
  dateOfBirth: dateOfBirthSchema,
  gender: z.enum(USER_GENDERS),
  countryCode: z.enum(USER_COUNTRY_CODES),
});

export const profileLanguagesSchema = z.string().trim().min(1, 'Add at least one language.').max(300);

export type SignupProfileFields = {
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  city?: UserCity | null;
  countryCode?: UserCountryCode | null;
  languages?: string | null;
};

const hasSignupLocation = (profile: SignupProfileFields | null | undefined): boolean => {
  if (profile?.countryCode && USER_COUNTRY_CODES.includes(profile.countryCode)) return true;
  return Boolean(profile?.city && USER_CITIES.includes(profile.city));
};

export const isSignupProfileComplete = (profile: SignupProfileFields | null | undefined): boolean =>
  Boolean(
    profile?.dateOfBirth?.trim() &&
      profile?.gender &&
      USER_GENDERS.includes(profile.gender) &&
      hasSignupLocation(profile)
  );

export const computeAgeFromDateOfBirth = (dateOfBirth: string): number | null => {
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

export const assertMinimumAge = (dateOfBirth: string, minYears: number, code = 'age_requirement_not_met'): void => {
  const age = computeAgeFromDateOfBirth(dateOfBirth);
  if (age == null) {
    throw new ApiError(400, 'invalid_date_of_birth', 'Enter a valid date of birth.');
  }
  if (age < minYears) {
    throw new ApiError(400, code, `You must be at least ${minYears} years old.`);
  }
};

export const assertSignupProfileAge = (dateOfBirth: string): void => {
  assertMinimumAge(dateOfBirth, 5, 'member_age_requirement_not_met');
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  const oldest = new Date();
  oldest.setFullYear(oldest.getFullYear() - 120);
  if (dob < oldest) {
    throw new ApiError(400, 'invalid_date_of_birth', 'Enter a valid date of birth.');
  }
};
