import type { UserRole } from '@uaetrail/shared-types';
import { isSignupProfileComplete } from './signupProfileSteps';

export const SIGNUP_PROFILE_WELCOME_PATH = '/welcome';

/** Consumer accounts complete member details after auth before using the app. */
export const needsSignupProfileGate = (role: UserRole | undefined): boolean =>
  role === 'participant' || role === 'merchant_admin';

export const isSignupProfileGateExemptPath = (pathname: string): boolean =>
  pathname === SIGNUP_PROFILE_WELCOME_PATH;

export const meProfileSignupGateKey = (userId: string) => ['me-profile-signup-gate', userId] as const;

/** Post-auth: send to `/welcome` when member details are incomplete. */
export const shouldForceSignupWelcome = (
  role: UserRole | undefined,
  profile: Parameters<typeof isSignupProfileComplete>[0]
): boolean => needsSignupProfileGate(role) && !isSignupProfileComplete(profile);
