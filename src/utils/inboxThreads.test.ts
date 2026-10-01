import { describe, expect, it } from 'vitest';
import { filterInboxThreads, groupThreadFromSocialGroup, type InboxThread } from './inboxThreads';
import type { SocialGroupView } from '../api/types';

const threads: InboxThread[] = [
  {
    kind: 'direct',
    id: 'u1',
    title: 'Sarah',
    lastMessage: 'See you Saturday',
    lastMessageAt: '2026-09-23T10:00:00.000Z',
    unreadCount: 2,
  },
  {
    kind: 'user-group',
    id: 'g1',
    title: 'Weekend Hikers',
    groupType: 'friends',
    lastMessage: 'Meet at 5:30',
    lastMessageAt: '2026-09-22T10:00:00.000Z',
    unreadCount: 0,
  },
  {
    kind: 'activity-chat',
    id: 'g2',
    title: 'Fossil Rock hike',
    lastMessage: 'Bring water',
    lastMessageAt: '2026-09-21T10:00:00.000Z',
    unreadCount: 0,
  },
];

describe('groupThreadFromSocialGroup', () => {
  it('maps chatPreview to inbox row with unread', () => {
    const group: SocialGroupView = {
      id: 'g1',
      type: 'friends',
      name: 'Weekend crew',
      adminUserId: 'a1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      chatPreview: {
        lastMessageBody: 'See you there',
        lastMessageAt: '2026-09-22T10:00:00.000Z',
        unreadCount: 3,
      },
    };
    const thread = groupThreadFromSocialGroup(group);
    expect(thread.kind).toBe('user-group');
    expect(thread.lastMessage).toBe('See you there');
    expect(thread.unreadCount).toBe(3);
  });
});

describe('filterInboxThreads', () => {
  it('filters by pill and search query', () => {
    expect(filterInboxThreads(threads, 'unread', '')).toHaveLength(1);
    expect(filterInboxThreads(threads, 'people', '')[0]?.title).toBe('Sarah');
    expect(filterInboxThreads(threads, 'groups', '')[0]?.title).toBe('Weekend Hikers');
    expect(filterInboxThreads(threads, 'outings', '')[0]?.title).toBe('Fossil Rock hike');
    expect(filterInboxThreads(threads, 'all', 'fossil')).toHaveLength(1);
  });
});
