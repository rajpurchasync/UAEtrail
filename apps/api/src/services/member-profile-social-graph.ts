import type { MemberProfileSocialGraphDTO, ProfileViewerAccessLevel } from '@uaetrail/shared-types';
import {
  computeProfileDetailExposure,
  DEFAULT_PROFILE_FRIENDS_LIST_SHARE,
  mergeProfileFriendsListShare,
  resolveProfileFriendsListVisibility,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findAuthUserById, type AuthUserRecord } from '../lib/auth-users-store.js';
import {
  countBuddyPairsForUser,
  listBuddiesForUser,
  listMutualBuddiesBetween,
} from '../lib/buddy-store.js';
import { listCommonFollowingBetween } from '../lib/follow-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { resolveProfileViewerAccess } from './profile-viewer-access.js';

const FRIENDS_LIST_CAP = 48;
const COMMON_FOLLOWS_CAP = 32;

export type MemberProfileSocialGraphParts = {
  friends: boolean;
  commonFollows: boolean;
};

export const parseMemberProfileSocialGraphParts = (raw: unknown): MemberProfileSocialGraphParts => {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { friends: true, commonFollows: true };
  }
  const tokens = new Set(
    raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  );
  if (tokens.size === 0) {
    return { friends: true, commonFollows: true };
  }
  const friends = tokens.has('friends');
  const commonFollows = tokens.has('commonFollows');
  if (!friends && !commonFollows) {
    return { friends: true, commonFollows: true };
  }
  return { friends, commonFollows };
};

type SocialGraphContext = {
  friendsListShare: MemberProfileSocialGraphDTO['friendsListShare'];
  friendsListVisibility: MemberProfileSocialGraphDTO['friendsListVisibility'];
  isSelf: boolean;
  viewerUserId: string | null;
  canOpenMemberProfile: boolean;
  targetUserId: string;
};

const resolveSocialGraphContext = async (input: {
  targetUserId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  preloadedTarget?: AuthUserRecord | null;
}): Promise<SocialGraphContext> => {
  const target =
    input.preloadedTarget && input.preloadedTarget._id === input.targetUserId
      ? input.preloadedTarget
      : await findAuthUserById(input.targetUserId);
  if (!target) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  const visibility = normalizeProfileVisibility(target.profile?.profileVisibility);
  const access = await resolveProfileViewerAccess({
    viewerUserId: input.viewerUserId,
    targetUserId: input.targetUserId,
    targetVisibility: visibility,
    isPlatformAdmin: input.isPlatformAdmin,
  });

  const isSelf = input.viewerUserId === input.targetUserId;
  const profileVisibility =
    visibility === 'group_members' ? 'group_members' : visibility === 'private' ? 'private' : 'public';
  const viewerAccess = computeProfileDetailExposure({
    profileVisibility,
    level: access.level as ProfileViewerAccessLevel,
    viewerUserId: input.viewerUserId,
  });
  const friendsListShare = mergeProfileFriendsListShare(
    target.profile?.friendsListShare,
    visibility
  );
  const friendsListVisibility = resolveProfileFriendsListVisibility({
    share: friendsListShare,
    isSelf,
    exposure: viewerAccess.exposure,
    canOpenMemberProfile: viewerAccess.canOpenMemberProfile,
  });

  return {
    friendsListShare: friendsListShare ?? DEFAULT_PROFILE_FRIENDS_LIST_SHARE,
    friendsListVisibility,
    isSelf,
    viewerUserId: input.viewerUserId,
    canOpenMemberProfile: viewerAccess.canOpenMemberProfile,
    targetUserId: input.targetUserId,
  };
};

export const loadMemberProfileSocialGraph = async (input: {
  targetUserId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  parts?: MemberProfileSocialGraphParts;
  preloadedTarget?: AuthUserRecord | null;
}): Promise<MemberProfileSocialGraphDTO> => {
  const parts = input.parts ?? { friends: true, commonFollows: true };
  const context = await resolveSocialGraphContext(input);

  const emptyFriends: MemberProfileSocialGraphDTO['friends'] = [];
  let friends = emptyFriends;
  let mutualFriendsCount = 0;

  if (parts.friends) {
    if (context.friendsListVisibility === 'full') {
      const [buddyRows, totalBuddies] = await Promise.all([
        listBuddiesForUser(context.targetUserId, FRIENDS_LIST_CAP),
        countBuddyPairsForUser(context.targetUserId),
      ]);
      friends = buddyRows;
      mutualFriendsCount = totalBuddies;
    } else if (context.friendsListVisibility === 'mutual' && context.viewerUserId) {
      const mutual = await listMutualBuddiesBetween(
        context.targetUserId,
        context.viewerUserId,
        FRIENDS_LIST_CAP
      );
      friends = mutual.buddies;
      mutualFriendsCount = mutual.totalMutual;
    } else if (context.isSelf) {
      const [buddyRows, totalBuddies] = await Promise.all([
        listBuddiesForUser(context.targetUserId, FRIENDS_LIST_CAP),
        countBuddyPairsForUser(context.targetUserId),
      ]);
      friends = buddyRows;
      mutualFriendsCount = totalBuddies;
    }
  }

  let commonFollows: MemberProfileSocialGraphDTO['commonFollows'] = [];
  if (
    parts.commonFollows &&
    context.viewerUserId &&
    !context.isSelf &&
    context.canOpenMemberProfile
  ) {
    commonFollows = await listCommonFollowingBetween(
      context.viewerUserId,
      context.targetUserId,
      COMMON_FOLLOWS_CAP
    );
  }

  return {
    friendsListShare: context.friendsListShare,
    friendsListVisibility: context.friendsListVisibility,
    friends,
    mutualFriendsCount,
    commonFollows,
  };
};
