import { describe, expect, it } from 'vitest';
import { activityDetailFriendsGoingLabel } from './activityDetailFriendsGoingLabel';

describe('activityDetailFriendsGoingLabel', () => {
  it('returns null when no buddies on the outing', () => {
    expect(activityDetailFriendsGoingLabel([])).toBeNull();
    expect(activityDetailFriendsGoingLabel(undefined)).toBeNull();
  });

  it('pluralizes friend count', () => {
    expect(activityDetailFriendsGoingLabel(['a'])).toBe('1 friend going');
    expect(activityDetailFriendsGoingLabel(['a', 'b'])).toBe('2 friends going');
  });
});
