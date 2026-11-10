import type { MemberProfileSocialGraphDTO } from '@uaetrail/shared-types';
import { DEFAULT_PROFILE_FRIENDS_LIST_SHARE } from '@uaetrail/shared-types';

export const mergeMemberProfileSocialGraphParts = (input: {
  embedded?: MemberProfileSocialGraphDTO | null;
  friendsPart?: MemberProfileSocialGraphDTO | null;
  commonPart?: MemberProfileSocialGraphDTO | null;
  fullPart?: MemberProfileSocialGraphDTO | null;
}): MemberProfileSocialGraphDTO | null => {
  if (input.embedded) return input.embedded;
  if (input.fullPart) return input.fullPart;

  const meta =
    input.friendsPart ??
    input.commonPart ??
    null;
  if (!meta && !input.friendsPart && !input.commonPart) return null;

  const friendsListShare =
    input.friendsPart?.friendsListShare ??
    input.commonPart?.friendsListShare ??
    DEFAULT_PROFILE_FRIENDS_LIST_SHARE;
  const friendsListVisibility =
    input.friendsPart?.friendsListVisibility ??
    input.commonPart?.friendsListVisibility ??
    'none';

  return {
    friendsListShare,
    friendsListVisibility,
    friends: input.friendsPart?.friends ?? [],
    mutualFriendsCount: input.friendsPart?.mutualFriendsCount ?? 0,
    commonFollows: input.commonPart?.commonFollows ?? [],
  };
};
