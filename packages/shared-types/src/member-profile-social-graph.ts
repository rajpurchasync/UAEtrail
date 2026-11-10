import type { BuddySummaryDTO } from './buddy-connection.js';
import type { MemberFollowSummaryDTO } from './member-follow.js';
import type { ProfileFriendsListShare, ProfileFriendsListVisibility } from './profile-friends-list-share.js';

export type MemberProfileSocialGraphDTO = {
  friendsListShare: ProfileFriendsListShare;
  friendsListVisibility: ProfileFriendsListVisibility;
  friends: BuddySummaryDTO[];
  mutualFriendsCount: number;
  commonFollows: MemberFollowSummaryDTO[];
};
