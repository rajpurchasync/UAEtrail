import type { UserProfile } from '../api/types';
import { resolveMemberDisplayName } from '@uaetrail/shared-types';

/** Strip account-type suffixes from wire profile names (demo seed legacy). */
export const normalizeMeProfile = (profile: UserProfile): UserProfile => ({
  ...profile,
  displayName: resolveMemberDisplayName({
    displayName: profile.displayName,
    givenName: profile.givenName,
    surname: profile.surname,
    email: profile.email,
  }),
});
