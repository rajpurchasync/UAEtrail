import type { CommunityJoinPolicy } from '@uaetrail/shared-types';

export const communityJoinPolicyLabel = (policy: CommunityJoinPolicy): string => {
  switch (policy) {
    case 'open':
      return 'Open to join';
    case 'request':
      return 'Host approval';
    case 'invite':
      return 'Invite only';
    default:
      return policy;
  }
};

export const COMMUNITY_OUTINGS_EMPTY_TITLE = 'Outings on the map soon';
export const COMMUNITY_OUTINGS_EMPTY_BODY =
  'When this community hosts hikes, camps, and group outings, they’ll show up here and on Explore.';

export const communityJoinCtaLabel = (input: {
  joinPolicy: CommunityJoinPolicy;
  canAcceptInvite: boolean;
}): string => {
  if (input.canAcceptInvite) return 'Accept invite';
  if (input.joinPolicy === 'request') return 'Request to join';
  if (input.joinPolicy === 'open') return 'Join';
  return 'Join community';
};

export const COMMUNITY_MEMBERSHIP_JOINED_LABEL = 'Joined';
export const COMMUNITY_MEMBERSHIP_REQUESTED_LABEL = 'Join requested';