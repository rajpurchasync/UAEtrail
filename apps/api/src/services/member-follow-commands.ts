import { followUser, isFollowingUser, unfollowUser } from '../lib/follow-store.js';
import { notifyMemberFollowed } from './social-notifications.js';

export const followMemberForUser = async (followerId: string, followingUserId: string) => {
  const wasFollowing = await isFollowingUser(followerId, followingUserId);
  const data = await followUser(followerId, followingUserId);
  if (!wasFollowing) {
    await notifyMemberFollowed({ followerUserId: followerId, followingUserId });
  }
  return data;
};

export const unfollowMemberForUser = (followerId: string, followingUserId: string) =>
  unfollowUser(followerId, followingUserId);
