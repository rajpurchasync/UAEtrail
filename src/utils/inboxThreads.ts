import type { ChatConversationDTO } from '@uaetrail/shared-types';
import { isOutingCrewGroupRow, resolveMemberGroupShape } from '@uaetrail/shared-types';
import type { SocialGroupView } from '../api/types';
import { messagingApi } from '../messaging';
import { formatWallInboxPreview } from './wallMessagePreview';

export type InboxFilter = 'unread' | 'people' | 'groups' | 'outings' | 'all';

/** Inbox quick-sort pills — order is canonical for Chat hub toolbar. */
export const INBOX_QUICK_SORT_PILLS: Array<{ key: InboxFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'groups', label: 'Teams' },
  { key: 'outings', label: 'Outing crew' },
  { key: 'people', label: 'Friends' },
];

export const DEFAULT_INBOX_FILTER: InboxFilter = 'all';

export type InboxFilterCounts = Record<InboxFilter, number>;

export const emptyInboxFilterCounts = (): InboxFilterCounts => ({
  unread: 0,
  people: 0,
  groups: 0,
  outings: 0,
  all: 0,
});

export const inboxFilterCountsFromThreads = (threads: InboxThread[]): InboxFilterCounts => {
  let people = 0;
  let groups = 0;
  let outings = 0;
  for (const thread of threads) {
    if (thread.unreadCount <= 0) continue;
    if (thread.kind === 'direct') people += thread.unreadCount;
    else if (thread.kind === 'user-group') groups += thread.unreadCount;
    else outings += thread.unreadCount;
  }
  const unread = people + groups + outings;
  return { unread, people, groups, outings, all: unread };
};

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
      groupType: 'family' | 'friends' | 'colleagues' | 'outing_crew';
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    }
  | {
      kind: 'activity-chat';
      id: string;
      title: string;
      activityId?: string | null;
      avatarUrl?: string;
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

  if (isOutingCrewGroupRow(group)) {
    return {
      kind: 'activity-chat',
      id: group.id,
      title: group.name,
      activityId: group.activityId,
      avatarUrl: group.photoUrl ?? undefined,
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
    groupType: (() => {
      const inbound = resolveMemberGroupShape(group).inboundType;
      return inbound === 'activity' ? 'outing_crew' : inbound;
    })(),
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
    thread.id === group.id && thread.kind !== 'direct'
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

/** Hub inbox — outings first when filter is All and list is unfiltered. */
export const partitionInboxThreadsForHub = (
  threads: InboxThread[]
): { outings: InboxThread[]; rest: InboxThread[] } => {
  const outings: InboxThread[] = [];
  const rest: InboxThread[] = [];
  for (const thread of threads) {
    if (thread.kind === 'activity-chat') outings.push(thread);
    else rest.push(thread);
  }
  return { outings, rest };
};

export const inboxThreadBadgeLabel = (thread: InboxThread): string | null => {
  if (thread.kind === 'direct') {
    return 'Friends';
  }
  if (thread.kind === 'user-group') {
    return 'Groups';
  }
  if (thread.kind === 'activity-chat') {
    return 'Community';
  }
  return null;
};
