import { useCallback, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatConversationDTO } from '@uaetrail/shared-types';
import type { SocialGroupView } from '../api/types';
import { messagingApi } from '../messaging';
import { messagesInboxQueryKey } from './clientQueryKeys';
import {
  loadGroupThreadPreviews,
  sortInboxThreads,
  type InboxThread,
} from '../utils/inboxThreads';

export type MessagesInboxData = {
  conversations: ChatConversationDTO[];
  groupThreads: InboxThread[];
  directConversationsDegraded: boolean;
};

const fetchMessagesInbox = async (): Promise<MessagesInboxData> => {
  const inboxRes = await messagingApi.getInbox();
  return {
    conversations: inboxRes.data.direct,
    groupThreads: loadGroupThreadPreviews(inboxRes.data.groups as SocialGroupView[]),
    directConversationsDegraded: Boolean(inboxRes.data.directConversationsDegraded),
  };
};

export const useMessagesInbox = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = userId ? messagesInboxQueryKey(userId) : ['messages-inbox', ''];

  const query = useQuery({
    queryKey,
    queryFn: fetchMessagesInbox,
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

  const data = query.data;

  const setConversations = useCallback(
    (updater: SetStateAction<ChatConversationDTO[]>) => {
      if (!userId) return;
      queryClient.setQueryData<MessagesInboxData>(messagesInboxQueryKey(userId), (old) => {
        const prev = old ?? {
          conversations: [],
          groupThreads: [],
          directConversationsDegraded: false,
        };
        const nextConversations =
          typeof updater === 'function' ? updater(prev.conversations) : updater;
        return { ...prev, conversations: nextConversations };
      });
    },
    [queryClient, userId]
  );

  const setGroupThreads = useCallback(
    (updater: SetStateAction<InboxThread[]>) => {
      if (!userId) return;
      queryClient.setQueryData<MessagesInboxData>(messagesInboxQueryKey(userId), (old) => {
        const prev = old ?? {
          conversations: [],
          groupThreads: [],
          directConversationsDegraded: false,
        };
        const nextThreads =
          typeof updater === 'function' ? updater(prev.groupThreads) : updater;
        return { ...prev, groupThreads: sortInboxThreads(nextThreads) };
      });
    },
    [queryClient, userId]
  );

  const loadInbox = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    conversations: data?.conversations ?? [],
    groupThreads: data?.groupThreads ?? [],
    directConversationsDegraded: data?.directConversationsDegraded ?? false,
    loading: query.isLoading,
    loadInbox,
    setConversations,
    setGroupThreads,
  };
};
