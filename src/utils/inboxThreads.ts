import type { ChatConversationDTO } from '@uaetrail/shared-types';
import type { SocialGroupView } from '../api/index';
import { api } from '../api/index';

export type InboxFilter = 'all' | 'unread' | 'people' | 'groups' | 'outings';

export type InboxThread =
  | {
      kind: 'direct';
      id: string;
      title: string;
      avatarUrl?: string;
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    }
  | {
      kind: 'user-group';
      id: string;
      title: string;
      avatarUrl?: string;
      groupType: 'family' | 'friends';
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    }
  | {
      kind: 'activity-chat';
      id: string;
      title: string;
      activityId?: string | null;
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    };

const sortThreads = (threads: InboxThread[]): InboxThread[] =>
  [...threads].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

export const toDirectThread = (conversation: ChatConversationDTO): InboxThread => ({
  kind: 'direct',
  id: conversation.userId,
  title: conversation.displayName,
  avatarUrl: conversation.avatarUrl,
  lastMessage: conversation.lastMessage || 'No messages yet',
  lastMessageAt: conversation.lastMessageAt,
  unreadCount: conversation.unreadCount ?? 0,
});

const buildGroupThread = async (group: SocialGroupView): Promise<InboxThread> => {
  let lastMessage = 'Open group chat';
  let lastMessageAt = group.updatedAt;

  try {
    const wall = await api.getMeGroupWall(group.id);
    const latest = wall.data[wall.data.length - 1];
    if (latest) {
      lastMessage = latest.body;
      lastMessageAt = latest.createdAt;
    }
  } catch {
    /* preview optional */
  }

  if (group.type === 'activity') {
    return {
      kind: 'activity-chat',
      id: group.id,
      title: group.name,
      activityId: group.activityId,
      lastMessage,
      lastMessageAt,
      unreadCount: 0,
    };
  }

  return {
    kind: 'user-group',
    id: group.id,
    title: group.name,
    avatarUrl: group.photoUrl ?? undefined,
    groupType: group.type,
    lastMessage,
    lastMessageAt,
    unreadCount: 0,
  };
};

export const sortInboxThreads = sortThreads;

export const loadGroupThreadPreviews = async (groups: SocialGroupView[]): Promise<InboxThread[]> =>
  Promise.all(groups.map(buildGroupThread));

export const loadInboxThreads = async (): Promise<InboxThread[]> => {
  const [conversationsRes, groupsRes] = await Promise.all([
    api.getConversations(),
    api.getMeGroups().catch(() => ({ data: [] as SocialGroupView[] })),
  ]);

  const directThreads = conversationsRes.data.map(toDirectThread);
  const groupThreads = await loadGroupThreadPreviews(groupsRes.data);

  return sortThreads([...directThreads, ...groupThreads]);
};

export const filterInboxThreads = (
  threads: InboxThread[],
  filter: InboxFilter,
  query: string
): InboxThread[] => {
  const normalizedQuery = query.trim().toLowerCase();

  return threads.filter((thread) => {
    if (filter === 'unread' && thread.unreadCount <= 0) return false;
    if (filter === 'people' && thread.kind !== 'direct') return false;
    if (filter === 'groups' && thread.kind !== 'user-group') return false;
    if (filter === 'outings' && thread.kind !== 'activity-chat') return false;

    if (!normalizedQuery) return true;

    return (
      thread.title.toLowerCase().includes(normalizedQuery) ||
      thread.lastMessage.toLowerCase().includes(normalizedQuery)
    );
  });
};

export const inboxThreadBadgeLabel = (thread: InboxThread): string | null => {
  if (thread.kind === 'direct') {
    return 'Direct';
  }
  if (thread.kind === 'user-group') {
    return thread.groupType === 'family' ? 'Family' : 'Friends';
  }
  if (thread.kind === 'activity-chat') {
    return 'Outing chat';
  }
  return null;
};
