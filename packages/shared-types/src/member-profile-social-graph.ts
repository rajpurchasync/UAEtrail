import type { FriendSummaryDTO } from './friend-connection.js';
import type { MemberFollowSummaryDTO } from './member-follow.js';
import type { ProfileFriendsListShare, ProfileFriendsListVisibility } from './profile-friends-list-share.js';

export type MemberProfileSocialGraphDTO = {
  friendsListShare: ProfileFriendsListShare;
  friendsListVisibility: ProfileFriendsListVisibility;
  friends: FriendSummaryDTO[];
  mutualFriendsCount: number;
  commonFollows: MemberFollowSummaryDTO[];
};
