export type UserGender = 'male' | 'female' | 'prefer_not_to_say';

export type UserCountryCode = 'AE' | 'SA' | 'OM' | 'QA' | 'BH' | 'KW';

export type UserCity =
  | 'dubai'
  | 'sharjah'
  | 'al_ain'
  | 'abu_dhabi'
  | 'ras_al_khaimah'
  | 'fujairah'
  | 'ajman'
  | 'umm_al_quwain';

export const USER_GENDER_OPTIONS: Array<{ value: UserGender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const USER_COUNTRY_OPTIONS: Array<{ value: UserCountryCode; label: string }> = [
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'OM', label: 'Oman' },
  { value: 'QA', label: 'Qatar' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'KW', label: 'Kuwait' },
];

export const USER_COUNTRY_LABELS = Object.fromEntries(
  USER_COUNTRY_OPTIONS.map((option) => [option.value, option.label])
) as Record<UserCountryCode, string>;

export const USER_CITY_OPTIONS: Array<{ value: UserCity; label: string }> = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'al_ain', label: 'Al Ain' },
  { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'ras_al_khaimah', label: 'Ras Al Khaimah' },
  { value: 'fujairah', label: 'Fujairah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'umm_al_quwain', label: 'Umm Al Quwain' },
];

export const USER_CITY_LABELS = Object.fromEntries(
  USER_CITY_OPTIONS.map((option) => [option.value, option.label])
) as Record<UserCity, string>;

export const resolveMemberCityLabel = (city: string | null | undefined): string | null => {
  if (!city?.trim()) return null;
  if (city in USER_CITY_LABELS) return USER_CITY_LABELS[city as UserCity];
  return city.trim();
};

export const maxDateOfBirthForMember = (): string => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 5);
  return cutoff.toISOString().slice(0, 10);
};

export { isSignupProfileComplete, firstIncompleteSignupStep, SIGNUP_PROFILE_STEP_COUNT } from '../utils/signupProfileSteps';
export type { SignupProfileStep } from '../utils/signupProfileSteps';
