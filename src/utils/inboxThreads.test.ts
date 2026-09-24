import { describe, expect, it } from 'vitest';
import { filterInboxThreads, type InboxThread } from './inboxThreads';

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

describe('filterInboxThreads', () => {
  it('filters by pill and search query', () => {
    expect(filterInboxThreads(threads, 'unread', '')).toHaveLength(1);
    expect(filterInboxThreads(threads, 'groups', '')[0]?.title).toBe('Weekend Hikers');
    expect(filterInboxThreads(threads, 'outings', '')[0]?.title).toBe('Fossil Rock hike');
    expect(filterInboxThreads(threads, 'all', 'fossil')).toHaveLength(1);
  });
});
