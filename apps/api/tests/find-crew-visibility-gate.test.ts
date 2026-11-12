import { describe, expect, it } from 'vitest';
import { readFindCrewVisibility } from '../src/lib/find-crew-visibility-gate.js';

describe('find-crew-visibility-gate', () => {
  it('defaults findCrewVisibility to friends_of_friends', () => {
    expect(readFindCrewVisibility(undefined)).toBe('friends_of_friends');
    expect(readFindCrewVisibility({ findCrewVisibility: 'none' })).toBe('none');
    expect(readFindCrewVisibility({ findCrewVisibility: 'friends' })).toBe('friends');
  });
});
