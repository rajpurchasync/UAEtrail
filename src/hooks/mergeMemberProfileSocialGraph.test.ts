import { describe, expect, it } from 'vitest';
import { mergeMemberProfileSocialGraphParts } from './mergeMemberProfileSocialGraph';

describe('mergeMemberProfileSocialGraphParts', () => {
  it('merges staged friends and common follows slices', () => {
    const merged = mergeMemberProfileSocialGraphParts({
      friendsPart: {
        friendsListShare: 'mutual_only',
        friendsListVisibility: 'mutual',
        friends: [{ userId: 'a', displayName: 'A', avatarUrl: null, connectedAt: '' }],
        mutualFriendsCount: 1,
        commonFollows: [],
      },
      commonPart: {
        friendsListShare: 'only_me',
        friendsListVisibility: 'none',
        friends: [],
        mutualFriendsCount: 0,
        commonFollows: [{ userId: 'b', displayName: 'B', avatarUrl: null, followedAt: '' }],
      },
    });
    expect(merged?.friends).toHaveLength(1);
    expect(merged?.commonFollows).toHaveLength(1);
  });
});
