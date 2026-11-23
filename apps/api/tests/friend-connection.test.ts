import { describe, expect, it } from 'vitest';
import { friendPairKey, sortedFriendUserIds } from '../src/domain/friend-connection.js';

describe('buddy pair key', () => {
  it('sorts user ids into a stable canonical key', () => {
    expect(friendPairKey('user-b', 'user-a')).toBe('user-a:user-b');
    expect(friendPairKey('user-a', 'user-b')).toBe('user-a:user-b');
  });

  it('returns sorted user ids for pair documents', () => {
    expect(sortedFriendUserIds('user-b', 'user-a')).toEqual(['user-a', 'user-b']);
  });
});
