import { describe, expect, it } from 'vitest';
import { ActivityType } from '../src/domain/enums.js';
import {
  buildActivityJoinInviteNotificationCopy,
  formatActivityJoinInviteDateLabel,
} from '../src/lib/activity-join-invite-copy.js';

describe('activity join invite copy', () => {
  it('formats notification with type and date', () => {
    const { body } = buildActivityJoinInviteNotificationCopy({
      inviterDisplayName: 'Samira',
      activity: {
        title: 'Shawka loop',
        activityType: ActivityType.HIKING,
        startAt: new Date('2026-11-15T09:00:00.000Z'),
      },
    });
    expect(body).toContain('Samira');
    expect(body).toContain('hiking trip');
    expect(body).toContain('Tap to view and join');
    expect(formatActivityJoinInviteDateLabel(new Date('2026-11-15T09:00:00.000Z'))).toMatch(/Nov/);
  });
});
