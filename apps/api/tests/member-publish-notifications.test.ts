import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listBuddiesForUser: vi.fn(),
  listFollowerIdsForUser: vi.fn(),
  createNotificationsMany: vi.fn(),
  findAuthUserById: vi.fn(),
}));

vi.mock('../src/lib/buddy-store.js', () => ({
  listBuddiesForUser: mocks.listBuddiesForUser,
}));

vi.mock('../src/lib/follow-store.js', () => ({
  listFollowerIdsForUser: mocks.listFollowerIdsForUser,
}));

vi.mock('../src/lib/notifications-store.js', () => ({
  createNotificationsMany: mocks.createNotificationsMany,
}));

vi.mock('../src/lib/auth-users.js', () => ({
  findAuthUserById: mocks.findAuthUserById,
}));

vi.mock('../src/lib/logger.js', () => ({
  logger: { warn: vi.fn() },
}));

vi.mock('../src/services/notification-actor-label.js', () => ({
  resolveNotificationActorDisplayName: vi.fn(async () => 'Host'),
}));

import { notifyMemberPublishSubscribers } from '../src/services/member-publish-notifications.js';

describe('notifyMemberPublishSubscribers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findAuthUserById.mockResolvedValue({ profile: { displayName: 'Host' } });
    mocks.createNotificationsMany.mockResolvedValue(undefined);
  });

  it('notifies buddies and followers when a hosted activity is published', async () => {
    mocks.listBuddiesForUser.mockResolvedValue([{ userId: 'buddy-1' }]);
    mocks.listFollowerIdsForUser.mockResolvedValue(['follower-1']);

    await notifyMemberPublishSubscribers('publisher', {
      publishType: 'activity',
      activityId: 'act-1',
      title: 'Friday hike',
    });

    expect(mocks.listFollowerIdsForUser).toHaveBeenCalledWith('publisher');
    const recipients = mocks.createNotificationsMany.mock.calls[0]![0]!.map(
      (row: { userId: string }) => row.userId
    );
    expect(recipients).toContain('buddy-1');
    expect(recipients).toContain('follower-1');
    const row = mocks.createNotificationsMany.mock.calls[0]![0]![0] as {
      meta: Record<string, string>;
    };
    expect(row.meta.kind).toBe('friend_activity_published');
    expect(row.meta.actorUserId).toBe('publisher');
    expect(row.meta.path).toBe('/activity/act-1');
  });

  it('notifies buddies only for demand posts (followers excluded)', async () => {
    mocks.listBuddiesForUser.mockResolvedValue([{ userId: 'buddy-1' }]);
    mocks.listFollowerIdsForUser.mockResolvedValue(['follower-1']);

    await notifyMemberPublishSubscribers('publisher', {
      publishType: 'demand',
      intentId: 'demand-1',
      title: 'Looking for a crew',
    });

    expect(mocks.listFollowerIdsForUser).not.toHaveBeenCalled();
    const recipients = mocks.createNotificationsMany.mock.calls[0]![0]!.map(
      (row: { userId: string }) => row.userId
    );
    expect(recipients).toEqual(['buddy-1']);
    const row = mocks.createNotificationsMany.mock.calls[0]![0]![0] as {
      meta: Record<string, string>;
    };
    expect(row.meta.kind).toBe('friend_published');
    expect(row.meta.intentId).toBe('demand-1');
  });
});
