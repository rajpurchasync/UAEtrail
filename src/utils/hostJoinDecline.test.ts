import { describe, expect, it } from 'vitest';
import { formatHostJoinDeclineNote } from '@uaetrail/shared-types';

describe('formatHostJoinDeclineNote', () => {
  it('uses preset label only', () => {
    expect(formatHostJoinDeclineNote('activity_full')).toBe('Activity is full');
  });

  it('appends optional message', () => {
    expect(formatHostJoinDeclineNote('not_right_fit', 'Try our beginner hike next week')).toBe(
      'Not the right fit for this outing — Try our beginner hike next week'
    );
  });

  it('uses free text for other', () => {
    expect(formatHostJoinDeclineNote('other', 'Need more trail experience first')).toBe(
      'Need more trail experience first'
    );
  });
});
