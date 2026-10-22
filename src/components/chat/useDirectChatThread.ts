import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type {
  ChatConversationDTO,
  ChatMessageDTO,
  ChatMessageReactionDTO,
} from '@uaetrail/shared-types';
import { directChatThreadQueryKey, inboxUnreadQueryKey } from '../../hooks/clientQueryKeys';
import {
  type DirectChatThreadCache,
  directMessagesMatchThread,
  mergeChatRowsById,
} from '../../utils/chatThreadCache';
import { fetchUserBrief } from '../../hooks/memberPeopleClientApi';
import { messagingApi } from '../../messaging';
import {
  createOptimisticChatId,
  isOptimisticChatId,
  replaceOptimisticChatRow,
} from '../../utils/chatOptimistic';
import { wallMessageQuoteSnippet } from '../../utils/groupWallReply';
import {
  CHAT_THREAD_INITIAL_LIMIT,
  CHAT_THREAD_MANUAL_OLDER_LIMIT,
  mergeOlderChatRows,
  shouldShowChatLoadMore,
} from '../../utils/chatThreadPagination';

type PartnerBrief = { displayName: string; avatarUrl?: string | null };

export type DirectChatScrollMode = 'initial' | 'bottom' | 'preserve';

type UseDirectChatThreadOptions = {
  currentUserId: string | undefined;
  /** Set only while the DM thread UI is open; null on inbox list (no message fetches). */
  partnerUserId: string | null;
  contextActivityId: string | null;
  conversations: ChatConversationDTO[];
  setConversations: Dispatch<SetStateAction<ChatConversationDTO[]>>;
  loadInbox: () => Promise<void>;
  setPageError: (message: string | null) => void;
  queryClient: QueryClient;
};

/** Direct 1:1 thread — load, send, stream updates (used from Chat inbox). */
export const useDirectChatThread = ({
  currentUserId,
  partnerUserId,
  contextActivityId,
  conversations,
  setConversations,
  loadInbox,
  setPageError,
  queryClient,
}: UseDirectChatThreadOptions) => {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [draft, setDraft] = useState('');
  const [activePartnerId, setActivePartnerId] = useState<string | null>(partnerUserId);
  const [loadingMessages, setLoadingMessages] = useState(Boolean(partnerUserId));
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [scrollMode, setScrollMode] = useState<DirectChatScrollMode>('initial');
  const [partnerBrief, setPartnerBrief] = useState<PartnerBrief | null>(null);
  const oldestAnchorId = (rows: ChatMessageDTO[]) =>
    rows.find((row) => !isOptimisticChatId(row.id))?.id ?? null;

  if (partnerUserId !== activePartnerId) {
    setActivePartnerId(partnerUserId);
    const cached =
      partnerUserId && currentUserId
        ? queryClient.getQueryData<DirectChatThreadCache>(directChatThreadQueryKey(currentUserId, partnerUserId))
        : undefined;
    if (cached?.messages.length) {
      setMessages(cached.messages);
      setHasMoreOlder(cached.hasMoreOlder);
      setLoadingMessages(false);
    } else {
      setMessages([]);
      setHasMoreOlder(false);
      setLoadingMessages(Boolean(partnerUserId));
    }
  }

  const markThreadReadInInbox = useCallback(
    (userId: string) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.userId === userId ? { ...conversation, unreadCount: 0 } : conversation
        )
      );
      if (currentUserId) {
        void queryClient.invalidateQueries({ queryKey: inboxUnreadQueryKey(currentUserId) });
      }
    },
    [currentUserId, queryClient, setConversations]
  );

  const loadInitialMessages = useCallback(
    async (
      userId: string,
      options?: { background?: boolean; seedMessages?: ChatMessageDTO[]; seedHasMoreOlder?: boolean }
    ) => {
      const background = options?.background ?? false;
      const seedMessages = options?.seedMessages ?? [];

      if (!background) {
        setLoadingMessages(true);
        setScrollMode('initial');
      }
      try {
        const res = await messagingApi.direct.listMessages(userId, {
          limit: CHAT_THREAD_INITIAL_LIMIT,
        });
        const serverMore =
          res.meta?.hasMoreOlder ?? res.data.length >= CHAT_THREAD_INITIAL_LIMIT;
        const merged =
          seedMessages.length > 0 ? mergeChatRowsById(seedMessages, res.data) : res.data;
        setMessages(merged);
        setHasMoreOlder(
          background
            ? Boolean(options?.seedHasMoreOlder) || serverMore
            : serverMore
        );
        markThreadReadInInbox(userId);
      } catch (e) {
        if (!background || seedMessages.length === 0) {
          setPageError(e instanceof Error ? e.message : 'Failed to load messages');
          setMessages([]);
          setHasMoreOlder(false);
        }
      } finally {
        if (!background) {
          setLoadingMessages(false);
        }
      }
    },
    [markThreadReadInInbox, setPageError]
  );

  const loadOlderMessages = useCallback(
    async (limit: number) => {
      if (!partnerUserId || loadingOlder || !hasMoreOlder) return;
      const anchorId = oldestAnchorId(messages);
      if (!anchorId) return;

      setLoadingOlder(true);
      setScrollMode('preserve');
      try {
        const res = await messagingApi.direct.listMessages(partnerUserId, {
          beforeMessageId: anchorId,
          limit,
        });
        if (res.data.length === 0) {
          setHasMoreOlder(false);
          return;
        }
        setMessages((prev) => mergeOlderChatRows(prev, res.data));
        setHasMoreOlder(res.meta?.hasMoreOlder ?? res.data.length >= limit);
      } catch {
        /* history load is best-effort */
      } finally {
        setLoadingOlder(false);
      }
    },
    [hasMoreOlder, loadingOlder, messages, partnerUserId]
  );

  useEffect(() => {
    if (!partnerUserId || !currentUserId) {
      setMessages([]);
      setDraft('');
      setHasMoreOlder(false);
      return;
    }
    setDraft('');

    const cacheKey = directChatThreadQueryKey(currentUserId, partnerUserId);
    const cached = queryClient.getQueryData<DirectChatThreadCache>(cacheKey);
    const hasCache = Boolean(cached?.messages.length);

    if (hasCache && cached) {
      setMessages(cached.messages);
      setHasMoreOlder(cached.hasMoreOlder);
      setLoadingMessages(false);
      setScrollMode('initial');
      void loadInitialMessages(partnerUserId, {
        background: true,
        seedMessages: cached.messages,
        seedHasMoreOlder: cached.hasMoreOlder,
      });
      return;
    }

    void loadInitialMessages(partnerUserId);
  }, [currentUserId, loadInitialMessages, partnerUserId, queryClient]);

  useEffect(() => {
    if (!currentUserId || !partnerUserId) return;
    if (!directMessagesMatchThread(messages, currentUserId, partnerUserId)) return;
    queryClient.setQueryData<DirectChatThreadCache>(
      directChatThreadQueryKey(currentUserId, partnerUserId),
      { messages, hasMoreOlder }
    );
  }, [currentUserId, hasMoreOlder, messages, partnerUserId, queryClient]);

  useEffect(() => {
    if (!partnerUserId) {
      setPartnerBrief(null);
      return;
    }
    const conv = conversations.find((conversation) => conversation.userId === partnerUserId);
    if (conv) {
      setPartnerBrief({ displayName: conv.displayName, avatarUrl: conv.avatarUrl });
      return;
    }
    fetchUserBrief(partnerUserId)
      .then((brief) => setPartnerBrief({ displayName: brief.displayName, avatarUrl: brief.avatarUrl }))
      .catch(() => setPartnerBrief(null));
  }, [partnerUserId, conversations]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.userId === partnerUserId
  );
  const partnerName = selectedConversation?.displayName ?? partnerBrief?.displayName ?? 'User';
  const partnerAvatar = selectedConversation?.avatarUrl ?? partnerBrief?.avatarUrl ?? undefined;

  const seedPartnerBrief = useCallback((brief: PartnerBrief) => {
    setPartnerBrief(brief);
  }, []);

  const send = useCallback(
    async (options?: { replyToMessageId?: string }) => {
      if (!currentUserId || !partnerUserId || !draft.trim()) return;
      const content = draft.trim();
      const replyToMessageId = options?.replyToMessageId;
      const quoted = replyToMessageId
        ? messages.find((message) => message.id === replyToMessageId)
        : undefined;
      const optimisticId = createOptimisticChatId();
      const optimistic: ChatMessageDTO = {
        id: optimisticId,
        senderId: currentUserId,
        receiverId: partnerUserId,
        content,
        createdAt: new Date().toISOString(),
        ...(contextActivityId ? { activityId: contextActivityId } : {}),
        ...(replyToMessageId ? { replyToMessageId } : {}),
        ...(quoted
          ? {
              replyToPreview: {
                messageId: quoted.id,
                authorDisplayName:
                  quoted.senderId === currentUserId ? 'You' : partnerName,
                bodySnippet: wallMessageQuoteSnippet(quoted.content),
              },
            }
          : {}),
      };

      setDraft('');
      setPageError(null);
      setScrollMode('bottom');
      setMessages((prev) => [...prev, optimistic]);
      setConversations((prev) => {
        const existing = prev.find((conversation) => conversation.userId === partnerUserId);
        if (!existing) {
          void loadInbox();
          return prev;
        }
        const updated = {
          ...existing,
          lastMessage: content,
          lastMessageAt: optimistic.createdAt,
        };
        return [updated, ...prev.filter((conversation) => conversation.userId !== partnerUserId)];
      });

      try {
        const res = await messagingApi.direct.send({
          receiverId: partnerUserId,
          content,
          ...(contextActivityId ? { activityId: contextActivityId } : {}),
          ...(replyToMessageId ? { replyToMessageId } : {}),
        });
        const sent = res.data;
        setMessages((prev) => replaceOptimisticChatRow(prev, optimisticId, sent));
        setConversations((prev) => {
          const existing = prev.find((conversation) => conversation.userId === partnerUserId);
          if (!existing) return prev;
          const updated = {
            ...existing,
            lastMessage: sent.content,
            lastMessageAt: sent.createdAt,
          };
          return [updated, ...prev.filter((conversation) => conversation.userId !== partnerUserId)];
        });
      } catch (err) {
        setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
        setDraft(content);
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setPageError(message);
        throw err;
      }
    },
    [
      contextActivityId,
      currentUserId,
      draft,
      loadInbox,
      messages,
      partnerName,
      partnerUserId,
      setConversations,
      setPageError,
    ]
  );

  const handleStreamMessage = useCallback(
    (message: ChatMessageDTO, openPartnerId: string | null) => {
      if (currentUserId) {
        const partner =
          message.senderId === currentUserId ? message.receiverId : message.senderId;
        const cacheKey = directChatThreadQueryKey(currentUserId, partner);
        const cached = queryClient.getQueryData<DirectChatThreadCache>(cacheKey);
        if (cached && !cached.messages.some((row) => row.id === message.id)) {
          queryClient.setQueryData<DirectChatThreadCache>(cacheKey, {
            ...cached,
            messages: mergeChatRowsById(cached.messages, [message]),
          });
        }
      }

      if (
        openPartnerId &&
        (message.senderId === openPartnerId || message.receiverId === openPartnerId)
      ) {
        setScrollMode('bottom');
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          if (message.senderId === currentUserId) {
            const pendingIndex = prev.findIndex(
              (item) =>
                isOptimisticChatId(item.id) &&
                item.senderId === currentUserId &&
                item.content === message.content
            );
            if (pendingIndex >= 0) {
              const next = [...prev];
              next[pendingIndex] = message;
              return next;
            }
          }
          return [...prev, message];
        });
      }

      setConversations((prev) => {
        const partner =
          message.senderId === currentUserId ? message.receiverId : message.senderId;
        const existing = prev.find((conversation) => conversation.userId === partner);
        if (!existing) {
          void loadInbox();
          return prev;
        }

        return prev
          .map((conversation) =>
            conversation.userId === partner
              ? {
                  ...conversation,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  unreadCount:
                    openPartnerId === partner && message.senderId === partner
                      ? 0
                      : message.senderId === partner
                        ? conversation.unreadCount + 1
                        : conversation.unreadCount,
                }
              : conversation
          )
          .sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
      });
    },
    [currentUserId, loadInbox, queryClient, setConversations]
  );

  const reloadSilent = useCallback(async () => {
    if (!partnerUserId) return;
    try {
      const res = await messagingApi.direct.listMessages(partnerUserId, {
        limit: CHAT_THREAD_INITIAL_LIMIT,
      });
      setMessages((prev) => mergeChatRowsById(prev, res.data));
    } catch {
      /* best-effort */
    }
  }, [partnerUserId]);

  const loadMoreOlder = useCallback(() => {
    void loadOlderMessages(CHAT_THREAD_MANUAL_OLDER_LIMIT);
  }, [loadOlderMessages]);

  const showLoadMore = shouldShowChatLoadMore(messages.length, hasMoreOlder);

  const updateMessageReactions = useCallback(
    (messageId: string, reactions: ChatMessageReactionDTO[]) => {
      setMessages((current) =>
        current.map((message) => (message.id === messageId ? { ...message, reactions } : message))
      );
    },
    []
  );

  const consumeScrollMode = useCallback(() => {
    const mode = scrollMode;
    if (scrollMode !== 'bottom') {
      setScrollMode('bottom');
    }
    return mode;
  }, [scrollMode]);

  return {
    messages,
    draft,
    setDraft,
    loadingMessages,
    loadingOlder,
    showLoadMore,
    loadMoreOlder,
    scrollMode,
    consumeScrollMode,
    partnerName,
    partnerAvatar,
    send,
    handleStreamMessage,
    reloadSilent,
    seedPartnerBrief,
    updateMessageReactions,
  };
};
