import type { UserCountryCode, UserGender } from '../constants/userProfileOptions';

export const SIGNUP_PROFILE_STEP_COUNT = 4;

export type SignupProfileStep = 'dateOfBirth' | 'gender' | 'languages' | 'countryCode';

export const SIGNUP_PROFILE_STEPS: SignupProfileStep[] = [
  'dateOfBirth',
  'gender',
  'languages',
  'countryCode',
];

export type SignupProfileDraft = {
  dateOfBirth: string;
  gender: UserGender | '';
  countryCode: UserCountryCode | '';
  languages: string[];
};

export const signupProfileStepIndex = (step: SignupProfileStep): number =>
  SIGNUP_PROFILE_STEPS.indexOf(step);

const hasSignupLocation = (profile: {
  countryCode?: UserCountryCode | null;
  city?: string | null;
}): boolean => {
  if (profile.countryCode) return true;
  return Boolean(profile.city);
};

export const firstIncompleteSignupStep = (profile: {
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  countryCode?: UserCountryCode | null;
  city?: string | null;
  languages?: string | null;
} | null | undefined): SignupProfileStep => {
  if (!profile?.dateOfBirth?.trim()) return 'dateOfBirth';
  if (!profile?.gender) return 'gender';
  if (!profile?.languages?.trim()) return 'languages';
  if (!hasSignupLocation(profile)) return 'countryCode';
  return 'countryCode';
};

export const isSignupProfileComplete = (profile: {
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  countryCode?: UserCountryCode | null;
  city?: string | null;
  languages?: string | null;
  signupProfileComplete?: boolean;
} | null | undefined): boolean => {
  if (profile?.signupProfileComplete) return true;
  return Boolean(
    profile?.dateOfBirth?.trim() &&
      profile?.gender &&
      profile?.languages?.trim() &&
      hasSignupLocation(profile)
  );
};
