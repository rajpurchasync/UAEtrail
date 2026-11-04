import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INBOX_FILTER,
  INBOX_FILTER_OPTIONS,
  filterInboxThreads,
  groupThreadFromSocialGroup,
  inboxFilterCountsFromThreads,
  type InboxThread,
} from './inboxThreads';
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

describe('INBOX_FILTER_OPTIONS', () => {
  it('leads with unread, then direct, and keeps all last', () => {
    expect(INBOX_FILTER_OPTIONS.map((option) => option.key)).toEqual([
      'unread',
      'people',
      'groups',
      'outings',
      'all',
    ]);
    expect(DEFAULT_INBOX_FILTER).toBe('people');
  });
});

describe('inboxFilterCountsFromThreads', () => {
  it('sums unread messages per chip, with unread and all sharing the total', () => {
    const counted = inboxFilterCountsFromThreads([
      ...threads,
      {
        kind: 'user-group',
        id: 'g3',
        title: 'Crew',
        groupType: 'friends',
        lastMessage: 'Hey',
        lastMessageAt: '2026-09-20T10:00:00.000Z',
        unreadCount: 4,
      },
      {
        kind: 'activity-chat',
        id: 'g4',
        title: 'Sunrise hike',
        lastMessage: 'Parking',
        lastMessageAt: '2026-09-19T10:00:00.000Z',
        unreadCount: 1,
      },
    ]);
    expect(counted).toEqual({ unread: 7, people: 2, groups: 4, outings: 1, all: 7 });
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
