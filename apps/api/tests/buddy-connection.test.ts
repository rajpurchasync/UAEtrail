import { describe, expect, it } from 'vitest';
import { buddyPairKey, sortedBuddyUserIds } from '../src/domain/buddy-connection.js';

describe('buddy pair key', () => {
  it('sorts user ids into a stable canonical key', () => {
    expect(buddyPairKey('user-b', 'user-a')).toBe('user-a:user-b');
    expect(buddyPairKey('user-a', 'user-b')).toBe('user-a:user-b');
  });

  it('returns sorted user ids for pair documents', () => {
    expect(sortedBuddyUserIds('user-b', 'user-a')).toEqual(['user-a', 'user-b']);
  });
});
