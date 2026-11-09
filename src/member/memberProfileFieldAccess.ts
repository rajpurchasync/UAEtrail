import type { ProfileViewerAccessDTO } from '@uaetrail/shared-types';

type ProfileAccessSlice = Pick<ProfileViewerAccessDTO, 'canViewFullProfile' | 'exposure'> | null | undefined;

/** Signed-in public member card (`exposure: public`) or trusted full profile. */
export const canViewMemberPublicCardFields = (access: ProfileAccessSlice): boolean =>
  Boolean(access?.canViewFullProfile || access?.exposure === 'public');

/** Buddies, co-participants, self — year goal, upcoming list, host reviews, etc. */
export const canViewMemberTrustedProfileFields = (
  access: Pick<ProfileViewerAccessDTO, 'canViewFullProfile'> | null | undefined
): boolean => Boolean(access?.canViewFullProfile);
