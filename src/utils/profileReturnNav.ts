import {
  mobileBackNavState,
  parseMobileBackNavState,
  type MobileBackNavState,
} from './mobileBackNav';

/** Router state when opening a member profile from another surface (e.g. group chat). */
export type ProfileReturnNavState = MobileBackNavState;

export const profileReturnNavState = (from: string, backLabel = 'Back'): ProfileReturnNavState =>
  mobileBackNavState(from, backLabel);

export const parseProfileReturnNavState = parseMobileBackNavState;
