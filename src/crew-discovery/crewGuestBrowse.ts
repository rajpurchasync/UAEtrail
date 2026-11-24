import { joinAuthPath } from '@/config/platform';

/** Guests may browse rows; profile / join flows route through sign-in. */
export const crewBrowseHrefForGuest = (targetHref: string, isSignedIn: boolean): string =>
  isSignedIn ? targetHref : joinAuthPath(targetHref);