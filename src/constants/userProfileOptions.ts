export type UserGender = 'male' | 'female' | 'prefer_not_to_say';

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

export const maxDateOfBirthForMember = (): string => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 5);
  return cutoff.toISOString().slice(0, 10);
};

export const isSignupProfileComplete = (profile: {
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  city?: UserCity | null;
  signupProfileComplete?: boolean;
} | null | undefined): boolean => {
  if (profile?.signupProfileComplete) return true;
  return Boolean(profile?.dateOfBirth?.trim() && profile?.gender && profile?.city);
};
