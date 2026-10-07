import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type {
  ChatConversationDTO,
  ChatMessageDTO,
  ChatMessageReactionDTO,
} from '@uaetrail/shared-types';
import { accountApi } from '../../api/domains/account';
import { messagingApi } from '../../messaging';

type PartnerBrief = { displayName: string; avatarUrl?: string | null };

type UseDirectChatThreadOptions = {
  currentUserId: string | undefined;
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
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [partnerBrief, setPartnerBrief] = useState<PartnerBrief | null>(null);

  const loadMessages = useCallback(
    async (userId: string, silent = false) => {
      if (!silent) setLoadingMessages(true);
      try {
        const res = await messagingApi.direct.listMessages(userId, 1, 100);
        setMessages(res.data.reverse());
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.userId === userId ? { ...conversation, unreadCount: 0 } : conversation
          )
        );
        if (currentUserId) {
          void queryClient.invalidateQueries({ queryKey: ['inbox-unread', currentUserId] });
        }
      } catch (e) {
        if (!silent) {
          setPageError(e instanceof Error ? e.message : 'Failed to load messages');
        }
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    [currentUserId, queryClient, setConversations, setPageError]
  );

  useEffect(() => {
    if (!partnerUserId) {
      setMessages([]);
      setDraft('');
      return;
    }
    setDraft('');
    void loadMessages(partnerUserId);
  }, [partnerUserId, loadMessages]);

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
    accountApi.getUserBrief(partnerUserId)
      .then((res) => setPartnerBrief(res.data))
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
      setSending(true);
      setPageError(null);
      try {
        const res = await messagingApi.direct.send({
          receiverId: partnerUserId,
          content: draft.trim(),
          ...(contextActivityId ? { activityId: contextActivityId } : {}),
          ...(options?.replyToMessageId ? { replyToMessageId: options.replyToMessageId } : {}),
        });
        const sent = res.data;
        setDraft('');
        setMessages((prev) => [...prev, sent]);
        setConversations((prev) => {
          const existing = prev.find((conversation) => conversation.userId === partnerUserId);
          if (!existing) {
            void loadInbox();
            return prev;
          }
          const updated = {
            ...existing,
            lastMessage: sent.content,
            lastMessageAt: sent.createdAt,
          };
          return [updated, ...prev.filter((conversation) => conversation.userId !== partnerUserId)];
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setPageError(message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [contextActivityId, currentUserId, draft, loadInbox, partnerUserId, setConversations, setPageError]
  );

  const handleStreamMessage = useCallback(
    (message: ChatMessageDTO, openPartnerId: string | null) => {
      if (
        openPartnerId &&
        (message.senderId === openPartnerId || message.receiverId === openPartnerId)
      ) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
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
    [currentUserId, loadInbox, setConversations]
  );

  const reloadSilent = useCallback(() => {
    if (partnerUserId) void loadMessages(partnerUserId, true);
  }, [loadMessages, partnerUserId]);

  const updateMessageReactions = useCallback(
    (messageId: string, reactions: ChatMessageReactionDTO[]) => {
      setMessages((current) =>
        current.map((message) => (message.id === messageId ? { ...message, reactions } : message))
      );
    },
    []
  );

  return {
    messages,
    draft,
    setDraft,
    loadingMessages,
    sending,
    partnerName,
    partnerAvatar,
    send,
    handleStreamMessage,
    reloadSilent,
    seedPartnerBrief,
    updateMessageReactions,
  };
};
