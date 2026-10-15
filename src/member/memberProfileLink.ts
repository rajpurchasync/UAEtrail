import { memberProfilePath, type MemberProfileBrowseLens } from '@uaetrail/shared-types';

/**
 * Canonical `/member/:id` URLs from consumer surfaces.
 * Authorization stays on API `viewerAccess` — lenses tag discover quota + analytics only.
 */
export const memberProfileLink = (
  userId: string,
  lens: MemberProfileBrowseLens = 'organic'
): string => {
  if (lens === 'discover') {
    return memberProfilePath(userId, { discover: true, lens: 'discover' })!;
  }
  if (lens === 'organic') {
    return memberProfilePath(userId)!;
  }
  return memberProfilePath(userId, { lens })!;
};
