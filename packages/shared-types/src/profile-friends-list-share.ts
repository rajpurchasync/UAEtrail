import type { ProfileDetailExposure } from './profile-viewer-access.js';

/** Who can see your friends list on `/member/:id`. */
export const PROFILE_FRIENDS_LIST_SHARE_LEVELS = [
  'only_me',
  'friends_crew',
  'mutual_only',
] as const;

export type ProfileFriendsListShare = (typeof PROFILE_FRIENDS_LIST_SHARE_LEVELS)[number];

export const DEFAULT_PROFILE_FRIENDS_LIST_SHARE: ProfileFriendsListShare = 'only_me';

export const mergeProfileFriendsListShare = (
  stored: unknown,
  profileVisibility?: 'public' | 'group_members' | 'private' | null
): ProfileFriendsListShare => {
  if (
    typeof stored === 'string' &&
    (PROFILE_FRIENDS_LIST_SHARE_LEVELS as readonly string[]).includes(stored)
  ) {
    return stored as ProfileFriendsListShare;
  }
  if (profileVisibility === 'private') return 'only_me';
  return DEFAULT_PROFILE_FRIENDS_LIST_SHARE;
};

export type ProfileFriendsListVisibility = 'none' | 'full' | 'mutual';

/** Resolve which friends slice a viewer may see on a member profile. */
export const resolveProfileFriendsListVisibility = (input: {
  share: ProfileFriendsListShare;
  isSelf: boolean;
  exposure: ProfileDetailExposure;
  canOpenMemberProfile: boolean;
}): ProfileFriendsListVisibility => {
  if (input.isSelf) return 'full';
  if (!input.canOpenMemberProfile) return 'none';
  if (input.share === 'only_me') return 'none';
  if (input.share === 'friends_crew') {
    return input.exposure === 'full' ? 'full' : 'none';
  }
  return 'mutual';
};
