import {
  countFollowersForUser,
  getFollowState,
  listFollowingForUser,
} from '../lib/follow-store.js';
import {
  countPublishedActivitiesHostedByUser,
  countUserCheckedInParticipations,
} from '../lib/activity-engagement-store.js';
import { isCommunityHostByUserId } from '../lib/community-host.js';
import { countParticipantIntentsByUser } from '../lib/participant-intents-store.js';

export const loadMeProfileEngagementStats = async (userId: string) => {
  const [followerCount, joinedCount, hostedCount, activeParticipantIntentCount, isCommunityHost] =
    await Promise.all([
      countFollowersForUser(userId),
      countUserCheckedInParticipations(userId),
      countPublishedActivitiesHostedByUser(userId),
      countParticipantIntentsByUser(userId),
      isCommunityHostByUserId(userId),
    ]);
  return {
    followerCount,
    joinedCount,
    hostedCount,
    activeParticipantIntentCount,
    isCommunityHost,
  };
};

export const listMeFollowingMembers = (userId: string) => listFollowingForUser(userId);

export const loadMeMemberFollowState = (viewerUserId: string, targetUserId: string) =>
  getFollowState(viewerUserId, targetUserId);
