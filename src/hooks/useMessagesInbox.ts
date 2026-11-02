import { useCallback, useEffect, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatConversationDTO } from '@uaetrail/shared-types';
import type { SocialGroupView } from '../api/types';
import { messagingApi } from '../messaging';
import {
  messagesInboxSliceQueryKey,
  type MessagesInboxSlice,
} from './clientQueryKeys';
import {
  loadGroupThreadPreviews,
  sortInboxThreads,
  type InboxFilter,
  type InboxThread,
} from '../utils/inboxThreads';

type DirectSlice = {
  conversations: ChatConversationDTO[];
  degraded: boolean;
};

type GroupSlice = {
  threads: InboxThread[];
};

type UnreadSlice = {
  conversations: ChatConversationDTO[];
  threads: InboxThread[];
  degraded: boolean;
};

const SLICE_STALE_MS = 20_000;

const pendingDirectKey = (userId: string) => ['messages-inbox-pending', userId, 'direct'] as const;
const pendingGroupKey = (userId: string) => ['messages-inbox-pending', userId, 'groups'] as const;

const mergeConversations = (
  base: ChatConversationDTO[],
  extra: ChatConversationDTO[]
): ChatConversationDTO[] => {
  const byId = new Map(base.map((row) => [row.userId, row]));
  for (const row of extra) {
    const current = byId.get(row.userId);
    if (!current || row.lastMessageAt >= current.lastMessageAt) byId.set(row.userId, row);
  }
  return [...byId.values()];
};

const mergeThreads = (base: InboxThread[], extra: InboxThread[]): InboxThread[] => {
  const byId = new Map(base.map((row) => [`${row.kind}:${row.id}`, row]));
  for (const row of extra) {
    const key = `${row.kind}:${row.id}`;
    const current = byId.get(key);
    if (!current || row.lastMessageAt >= current.lastMessageAt) byId.set(key, row);
  }
  return [...byId.values()];
};

const fetchDirectSlice = async (): Promise<DirectSlice> => {
  const inbox = await messagingApi.getInbox('direct');
  return {
    conversations: inbox.data.direct,
    degraded: Boolean(inbox.data.directConversationsDegraded),
  };
};

const fetchGroupSlice = async (scope: 'groups' | 'outings'): Promise<GroupSlice> => {
  const inbox = await messagingApi.getInbox(scope);
  return { threads: loadGroupThreadPreviews(inbox.data.groups as SocialGroupView[]) };
};

const fetchUnreadSlice = async (): Promise<UnreadSlice> => {
  const inbox = await messagingApi.getInbox('unread');
  return {
    conversations: inbox.data.direct,
    threads: loadGroupThreadPreviews(inbox.data.groups as SocialGroupView[]),
    degraded: Boolean(inbox.data.directConversationsDegraded),
  };
};

const sliceKey = (userId: string, slice: MessagesInboxSlice) => messagesInboxSliceQueryKey(userId, slice);

export const unreadInboxSliceQueryKey = (userId: string) => sliceKey(userId, 'unread');

export const fetchUnreadInboxSlice = fetchUnreadSlice;

export const useMessagesInbox = (userId: string | undefined, filter: InboxFilter) => {
  const queryClient = useQueryClient();
  const enabled = Boolean(userId);
  const userKey = userId ?? '';

  const direct = useQuery({
    queryKey: sliceKey(userKey, 'direct'),
    queryFn: fetchDirectSlice,
    enabled: enabled && filter === 'people',
    staleTime: SLICE_STALE_MS,
  });
  const groups = useQuery({
    queryKey: sliceKey(userKey, 'groups'),
    queryFn: () => fetchGroupSlice('groups'),
    enabled: enabled && filter === 'groups',
    staleTime: SLICE_STALE_MS,
  });
  const outings = useQuery({
    queryKey: sliceKey(userKey, 'outings'),
    queryFn: () => fetchGroupSlice('outings'),
    enabled: enabled && filter === 'outings',
    staleTime: SLICE_STALE_MS,
  });

  const pendingDirectQuery = useQuery({
    queryKey: pendingDirectKey(userKey),
    queryFn: () =>
      queryClient.getQueryData<ChatConversationDTO[]>(pendingDirectKey(userKey)) ?? [],
    enabled,
    staleTime: Infinity,
    initialData: [] as ChatConversationDTO[],
    initialDataUpdatedAt: 0,
  });
  const pendingGroupQuery = useQuery({
    queryKey: pendingGroupKey(userKey),
    queryFn: () => queryClient.getQueryData<InboxThread[]>(pendingGroupKey(userKey)) ?? [],
    enabled,
    staleTime: Infinity,
    initialData: [] as InboxThread[],
    initialDataUpdatedAt: 0,
  });

  const combined = useQuery({
    queryKey: ['messages-inbox', userKey, 'combined'] as const,
    queryFn: async () => {
      const inbox = await messagingApi.getInbox();
      const threads = loadGroupThreadPreviews(inbox.data.groups as SocialGroupView[]);
      const directSlice: DirectSlice = {
        conversations: inbox.data.direct,
        degraded: Boolean(inbox.data.directConversationsDegraded),
      };
      queryClient.setQueryData<DirectSlice>(sliceKey(userKey, 'direct'), directSlice);
      queryClient.setQueryData<GroupSlice>(sliceKey(userKey, 'groups'), {
        threads: threads.filter((thread) => thread.kind === 'user-group'),
      });
      queryClient.setQueryData<GroupSlice>(sliceKey(userKey, 'outings'), {
        threads: threads.filter((thread) => thread.kind === 'activity-chat'),
      });
      return directSlice;
    },
    enabled: enabled && filter === 'all',
    staleTime: SLICE_STALE_MS,
  });

  const slicesCoverAll = direct.isSuccess && groups.isSuccess && outings.isSuccess;

  const unread = useQuery({
    queryKey: sliceKey(userKey, 'unread'),
    queryFn: fetchUnreadSlice,
    enabled: enabled && filter === 'unread' && !slicesCoverAll,
    staleTime: SLICE_STALE_MS,
  });

  const pendingDirect = pendingDirectQuery.data ?? [];
  const pendingGroups = pendingGroupQuery.data ?? [];

  useEffect(() => {
    if (!userId || !direct.data) return;
    const ids = new Set(direct.data.conversations.map((row) => row.userId));
    queryClient.setQueryData<ChatConversationDTO[]>(pendingDirectKey(userId), (rows = []) =>
      rows.filter((row) => !ids.has(row.userId))
    );
  }, [direct.data, queryClient, userId]);

  useEffect(() => {
    if (!userId || (!groups.data && !outings.data)) return;
    const ids = new Set([
      ...(groups.data?.threads ?? []).map((row) => `${row.kind}:${row.id}`),
      ...(outings.data?.threads ?? []).map((row) => `${row.kind}:${row.id}`),
    ]);
    queryClient.setQueryData<InboxThread[]>(pendingGroupKey(userId), (rows = []) =>
      rows.filter((row) => !ids.has(`${row.kind}:${row.id}`))
    );
  }, [groups.data, outings.data, queryClient, userId]);

  const setConversations = useCallback(
    (updater: SetStateAction<ChatConversationDTO[]>) => {
      if (!userId) return;
      const directCached = queryClient.getQueryData<DirectSlice>(sliceKey(userId, 'direct'));
      const unreadCached = queryClient.getQueryData<UnreadSlice>(sliceKey(userId, 'unread'));
      const pending = queryClient.getQueryData<ChatConversationDTO[]>(pendingDirectKey(userId)) ?? [];
      const base = directCached?.conversations ?? unreadCached?.conversations ?? pending;
      const next = typeof updater === 'function' ? updater(base) : updater;

      if (directCached) {
        queryClient.setQueryData<DirectSlice>(sliceKey(userId, 'direct'), {
          ...directCached,
          conversations: next,
        });
      } else if (unreadCached && base === unreadCached.conversations) {
        queryClient.setQueryData<UnreadSlice>(sliceKey(userId, 'unread'), {
          ...unreadCached,
          conversations: next.filter((row) => row.unreadCount > 0),
        });
        const known = new Set(unreadCached.conversations.map((row) => row.userId));
        const added = next.filter((row) => !known.has(row.userId));
        if (added.length > 0) {
          queryClient.setQueryData<ChatConversationDTO[]>(pendingDirectKey(userId), (rows = []) =>
            mergeConversations(rows, added)
          );
        }
      } else {
        queryClient.setQueryData(pendingDirectKey(userId), next);
      }

      if (directCached && unreadCached) {
        const byId = new Map(next.map((row) => [row.userId, row]));
        const conversations = unreadCached.conversations.flatMap((row) => {
          const updated = byId.get(row.userId);
          if (!updated) return [row];
          return updated.unreadCount > 0 ? [updated] : [];
        });
        for (const row of next) {
          if (row.unreadCount > 0 && !conversations.some((item) => item.userId === row.userId)) {
            conversations.push(row);
          }
        }
        queryClient.setQueryData<UnreadSlice>(sliceKey(userId, 'unread'), {
          ...unreadCached,
          conversations,
        });
      }
    },
    [queryClient, userId]
  );

  const setGroupThreads = useCallback(
    (updater: SetStateAction<InboxThread[]>) => {
      if (!userId) return;
      const groupsCached = queryClient.getQueryData<GroupSlice>(sliceKey(userId, 'groups'));
      const outingsCached = queryClient.getQueryData<GroupSlice>(sliceKey(userId, 'outings'));
      const unreadCached = queryClient.getQueryData<UnreadSlice>(sliceKey(userId, 'unread'));
      const pending = queryClient.getQueryData<InboxThread[]>(pendingGroupKey(userId)) ?? [];
      const base = mergeThreads(
        mergeThreads(groupsCached?.threads ?? [], outingsCached?.threads ?? []),
        mergeThreads(unreadCached?.threads ?? [], pending)
      );
      const next = sortInboxThreads(typeof updater === 'function' ? updater(base) : updater);

      if (groupsCached) {
        queryClient.setQueryData<GroupSlice>(sliceKey(userId, 'groups'), {
          threads: next.filter((thread) => thread.kind === 'user-group'),
        });
      }
      if (outingsCached) {
        queryClient.setQueryData<GroupSlice>(sliceKey(userId, 'outings'), {
          threads: next.filter((thread) => thread.kind === 'activity-chat'),
        });
      }
      const missing = next.filter((thread) => {
        if (thread.kind === 'user-group') return !groupsCached;
        if (thread.kind === 'activity-chat') return !outingsCached;
        return false;
      });
      queryClient.setQueryData(pendingGroupKey(userId), missing);

      if (unreadCached) {
        queryClient.setQueryData<UnreadSlice>(sliceKey(userId, 'unread'), {
          ...unreadCached,
          threads: next.filter((thread) => thread.kind !== 'direct' && thread.unreadCount > 0),
        });
      }
    },
    [queryClient, userId]
  );

  const loadInbox = useCallback(async () => {
    if (!userId) return;
    if (filter === 'people') {
      await direct.refetch();
      return;
    }
    if (filter === 'groups') {
      await groups.refetch();
      return;
    }
    if (filter === 'outings') {
      await outings.refetch();
      return;
    }
    if (filter === 'all') {
      await combined.refetch();
      return;
    }
    if (slicesCoverAll) {
      await Promise.all([direct.refetch(), groups.refetch(), outings.refetch()]);
      return;
    }
    await unread.refetch();
  }, [combined, direct, filter, groups, outings, slicesCoverAll, unread, userId]);

  const directs = mergeConversations(direct.data?.conversations ?? [], pendingDirect);
  const userGroups = mergeThreads(
    groups.data?.threads ?? [],
    pendingGroups.filter((thread) => thread.kind === 'user-group')
  );
  const outingThreads = mergeThreads(
    outings.data?.threads ?? [],
    pendingGroups.filter((thread) => thread.kind === 'activity-chat')
  );

  let conversations: ChatConversationDTO[] = [];
  let groupThreads: InboxThread[] = [];

  if (filter === 'people') {
    conversations = directs;
  } else if (filter === 'groups') {
    groupThreads = userGroups;
  } else if (filter === 'outings') {
    groupThreads = outingThreads;
  } else if (filter === 'all') {
    conversations = directs;
    groupThreads = mergeThreads(userGroups, outingThreads);
  } else if (slicesCoverAll) {
    conversations = directs.filter((row) => row.unreadCount > 0);
    groupThreads = mergeThreads(userGroups, outingThreads).filter((thread) => thread.unreadCount > 0);
  } else {
    conversations = mergeConversations(unread.data?.conversations ?? [], pendingDirect).filter(
      (row) => row.unreadCount > 0
    );
    groupThreads = mergeThreads(unread.data?.threads ?? [], pendingGroups).filter(
      (thread) => thread.unreadCount > 0
    );
  }

  const activeQuery =
    filter === 'people'
      ? direct
      : filter === 'groups'
        ? groups
        : filter === 'outings'
          ? outings
          : filter === 'all'
            ? null
            : slicesCoverAll
              ? null
              : unread;

  const allReady =
    direct.data !== undefined && groups.data !== undefined && outings.data !== undefined;

  const loading =
    filter === 'all'
      ? !allReady && combined.isPending
      : Boolean(activeQuery && activeQuery.isPending && activeQuery.data === undefined);

  const unavailable =
    filter === 'all'
      ? !allReady && combined.isError
      : Boolean(activeQuery?.isError && activeQuery.data === undefined);

  return {
    conversations,
    groupThreads: sortInboxThreads(groupThreads),
    directConversationsDegraded:
      direct.data?.degraded === true || (filter === 'unread' && unread.data?.degraded === true),
    loading,
    unavailable,
    loadInbox,
    setConversations,
    setGroupThreads,
  };
};
