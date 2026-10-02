import type { ChatConversationDTO } from '@uaetrail/shared-types';
import type { SocialGroupView } from '../api/index';
import { messagingApi } from '../messaging';
import { formatWallInboxPreview } from './wallMessagePreview';

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

export const groupThreadFromSocialGroup = (group: SocialGroupView): InboxThread => {
  const preview = group.chatPreview;
  const lastMessage = preview?.lastMessageBody
    ? formatWallInboxPreview(preview.lastMessageBody)
    : 'Open group chat';
  const lastMessageAt = preview?.lastMessageAt ?? group.updatedAt;
  const unreadCount = preview?.unreadCount ?? 0;

  if (group.type === 'activity') {
    return {
      kind: 'activity-chat',
      id: group.id,
      title: group.name,
      activityId: group.activityId,
      lastMessage,
      lastMessageAt,
      unreadCount,
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
    unreadCount,
  };
};

export const sortInboxThreads = sortThreads;

export const loadGroupThreadPreviews = (groups: SocialGroupView[]): InboxThread[] =>
  groups.map(groupThreadFromSocialGroup);

export const patchGroupInboxThread = (
  threads: InboxThread[],
  group: Pick<SocialGroupView, 'id' | 'photoUrl'>
): InboxThread[] =>
  threads.map((thread) =>
    thread.kind === 'user-group' && thread.id === group.id
      ? { ...thread, avatarUrl: group.photoUrl ?? undefined }
      : thread
  );

export const loadInboxThreads = async (): Promise<InboxThread[]> => {
  const res = await messagingApi.getInbox();
  const directThreads = res.data.direct.map(toDirectThread);
  const groupThreads = loadGroupThreadPreviews(res.data.groups as SocialGroupView[]);
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
