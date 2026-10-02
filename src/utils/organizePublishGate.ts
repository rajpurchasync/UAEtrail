import { SIGNUP_PROFILE_WELCOME_PATH } from './signupProfileGate';

export type OrganizePublishGate = {
  /** Member profile completion (`signupProfileComplete` / `/welcome`). Required before buddy Organize. */
  signupProfileComplete: boolean;
  canPublish: boolean;
};

/** Redirect target when a signed-in member cannot open Organize yet. */
export const organizePublishGateHref = (returnTo: string, gate: OrganizePublishGate): string => {
  const redirect = returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : '';
  if (!gate.signupProfileComplete) {
    return `${SIGNUP_PROFILE_WELCOME_PATH}${redirect}`;
  }
  return `/profile${redirect}`;
};
