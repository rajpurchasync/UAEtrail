import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE_FRIENDS_LIST_SHARE,
  mergeProfileFriendsListShare,
  resolveProfileFriendsListVisibility,
} from './profile-friends-list-share';

describe('profile-friends-list-share', () => {
  it('defaults to only_me (stricter when profile is private)', () => {
    expect(DEFAULT_PROFILE_FRIENDS_LIST_SHARE).toBe('only_me');
    expect(mergeProfileFriendsListShare(undefined)).toBe('only_me');
    expect(mergeProfileFriendsListShare(null, 'private')).toBe('only_me');
    expect(mergeProfileFriendsListShare('friends_crew', 'public')).toBe('friends_crew');
  });

  it('resolveProfileFriendsListVisibility', () => {
    expect(
      resolveProfileFriendsListVisibility({
        share: 'only_me',
        isSelf: false,
        exposure: 'full',
        canOpenMemberProfile: true,
      })
    ).toBe('none');
    expect(
      resolveProfileFriendsListVisibility({
        share: 'friends_crew',
        isSelf: false,
        exposure: 'full',
        canOpenMemberProfile: true,
      })
    ).toBe('full');
    expect(
      resolveProfileFriendsListVisibility({
        share: 'friends_crew',
        isSelf: false,
        exposure: 'public',
        canOpenMemberProfile: true,
      })
    ).toBe('none');
    expect(
      resolveProfileFriendsListVisibility({
        share: 'mutual_only',
        isSelf: false,
        exposure: 'public',
        canOpenMemberProfile: true,
      })
    ).toBe('mutual');
    expect(
      resolveProfileFriendsListVisibility({
        share: 'mutual_only',
        isSelf: true,
        exposure: 'none',
        canOpenMemberProfile: true,
      })
    ).toBe('full');
  });
});
