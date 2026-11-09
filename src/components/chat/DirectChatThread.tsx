import { useCallback, useLayoutEffect, useRef } from 'react';
import {
  applyChatScrollPreserveAnchor,
  type ChatScrollPreserveAnchor,
  captureChatScrollPreserveAnchor,
  chatMessageAnchorSelector,
} from '../../utils/chatScrollPreserve';
import { Flag, MessageSquare } from 'lucide-react';
import type { ChatMessageDTO, ChatMessageReactionDTO } from '@uaetrail/shared-types';
import { DirectMessageBubble } from './DirectMessageBubble';
import { chatMessageRowAlign } from './chatMessageLayout';
import { ChatReplyComposer } from './ChatReplyComposer';
import {
  ChatMessageDateSeparator,
  shouldShowChatDateSeparator,
} from './ChatMessageDateSeparator';
import { runWithReplyTarget, useThreadReply } from './useThreadReply';
import { ChatThreadShell } from './ChatThreadShell';
import { ChatThreadHeaderBar } from './ChatThreadHeaderBar';
import { MessageAvatar } from './ChatMessageAvatar';
import { ChatThreadLoadMore } from './ChatThreadLoadMore';
import { ChatLoadingState } from './ChatLoadingState';
import { messagesToUserPath } from '../../config/routingCatalog';
import { memberProfileLink } from '../../member/memberProfileLink';
import { profileReturnNavState } from '../../utils/profileReturnNav';
import type { DirectChatScrollMode } from './useDirectChatThread';

export type DirectChatThreadProps = {
  mobileShowThread: boolean;
  partnerUserId: string | null;
  currentUserId: string;
  partnerName: string;
  partnerAvatar?: string;
  loadingMessages: boolean;
  messages: ChatMessageDTO[];
  draft: string;
  onBack: () => void;
  onReport: () => void;
  onDraftChange: (value: string) => void;
  onSend: (options?: { replyToMessageId?: string }) => void | Promise<void>;
  onReactionError?: (message: string) => void;
  onMessageReactionsChange: (messageId: string, reactions: ChatMessageReactionDTO[]) => void;
  loadingOlder?: boolean;
  showLoadMore?: boolean;
  onLoadMoreOlder?: () => void;
  consumeScrollMode?: () => DirectChatScrollMode;
};

export const DirectChatThread = ({
  mobileShowThread,
  partnerUserId,
  currentUserId,
  partnerName,
  partnerAvatar,
  loadingMessages,
  messages,
  draft,
  onBack,
  onReport,
  onDraftChange,
  onSend,
  onReactionError,
  onMessageReactionsChange,
  loadingOlder = false,
  showLoadMore = false,
  onLoadMoreOlder,
  consumeScrollMode,
}: DirectChatThreadProps) => {
  const prevCountRef = useRef(0);
  const skipInitialScrollRef = useRef(true);
  const preserveScrollAnchorRef = useRef<ChatScrollPreserveAnchor | null>(null);
  const preparedPartnerRef = useRef<string | null>(null);
  if (preparedPartnerRef.current !== partnerUserId) {
    preparedPartnerRef.current = partnerUserId;
    skipInitialScrollRef.current = true;
    prevCountRef.current = 0;
    preserveScrollAnchorRef.current = null;
  }
  const {
    replyTo,
    setReplyTo,
    clearReply,
    highlightMessageId,
    scrollContainerRef: messagesContainerRef,
    scrollToMessage,
  } = useThreadReply(partnerUserId, 'data-dm-message-id');

  const handleLoadMoreOlder = useCallback(() => {
    const container = messagesContainerRef.current;
    preserveScrollAnchorRef.current = captureChatScrollPreserveAnchor(
      container,
      chatMessageAnchorSelector(container, 'data-dm-message-id')
    );
    onLoadMoreOlder?.();
  }, [messagesContainerRef, onLoadMoreOlder]);

  const resolveQuotedMessage = useCallback(
    (messageId: string) => {
      const quoted = messages.find((m) => m.id === messageId);
      if (!quoted || !partnerUserId) return null;
      const authorName = quoted.senderId === currentUserId ? 'You' : partnerName;
      return { authorName, body: quoted.content };
    },
    [messages, partnerUserId, currentUserId, partnerName]
  );

  const submitMessage = async () => {
    if (!draft.trim()) return;
    await runWithReplyTarget(replyTo, setReplyTo, (replyToMessageId) =>
      onSend(replyToMessageId ? { replyToMessageId } : undefined)
    );
  };

  useLayoutEffect(() => {
    if (loadingMessages) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const anchor = preserveScrollAnchorRef.current;
    if (anchor) {
      if (messages.length > prevCountRef.current) {
        applyChatScrollPreserveAnchor(container, anchor);
        preserveScrollAnchorRef.current = null;
        prevCountRef.current = messages.length;
        consumeScrollMode?.();
      } else if (!loadingOlder) {
        preserveScrollAnchorRef.current = null;
      }
      return;
    }

    const mode = consumeScrollMode?.() ?? 'bottom';

    if (skipInitialScrollRef.current || mode === 'initial') {
      skipInitialScrollRef.current = false;
      prevCountRef.current = messages.length;
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (messages.length > prevCountRef.current && mode === 'bottom') {
      container.scrollTop = container.scrollHeight;
      prevCountRef.current = messages.length;
    }
  }, [
    messages.length,
    loadingMessages,
    loadingOlder,
    partnerUserId,
    messagesContainerRef,
    consumeScrollMode,
  ]);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col bg-white h-full ${!mobileShowThread && !partnerUserId ? 'hidden md:flex' : 'flex'}`}
    >
      {!partnerUserId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-4">
          <MessageSquare className="w-16 h-16 mb-4 text-gray-200" />
          <p className="text-lg font-medium text-gray-500 mb-1">Your chats</p>
          <p className="text-sm text-center">Select a conversation or start a new one</p>
        </div>
      ) : (
        <ChatThreadShell
          scrollContainerRef={messagesContainerRef}
          scrollVariant="direct"
          header={
            <ChatThreadHeaderBar
              onBack={onBack}
              backLabel="Back to chat list"
              backVisibility="mobile-only"
              titleButton={{
                to: memberProfileLink(partnerUserId),
                state: profileReturnNavState(messagesToUserPath(partnerUserId), 'Back to chat'),
              }}
              leading={<MessageAvatar name={partnerName} url={partnerAvatar} />}
              title={partnerName}
              trailing={
                <button
                  type="button"
                  onClick={onReport}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                  aria-label="Report user"
                  title="Report user"
                >
                  <Flag className="w-4 h-4" />
                </button>
              }
            />
          }
          footer={
            <ChatReplyComposer
              replyTo={replyTo}
              onCancelReply={clearReply}
              showQuoteSnippet
              value={draft}
              onChange={onDraftChange}
              onSend={submitMessage}
            />
          }
        >
          {loadingMessages ? (
            <ChatLoadingState variant="thread" label="Loading messages" />
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-16 font-emoji">No messages yet. Say hello! 👋</p>
          ) : (
            <>
              {showLoadMore && onLoadMoreOlder ? (
                <ChatThreadLoadMore loading={loadingOlder} onClick={handleLoadMoreOlder} />
              ) : loadingOlder ? (
                <p className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-neutral-500" role="status" aria-live="polite">
                  Loading earlier messages
                </p>
              ) : null}
              {messages.map((m, i) => {
                const isMe = m.senderId === currentUserId;
                const showDate = shouldShowChatDateSeparator(m.createdAt, messages[i - 1]?.createdAt);
                return (
                  <div key={m.id}>
                    {showDate ? <ChatMessageDateSeparator isoDate={m.createdAt} /> : null}
                    <div className={chatMessageRowAlign(isMe)}>
                      <DirectMessageBubble
                        message={m}
                        isMe={isMe}
                        partnerUserId={partnerUserId}
                        partnerDisplayName={partnerName}
                        highlighted={highlightMessageId === m.id}
                        onReactionsChange={onMessageReactionsChange}
                        onReply={setReplyTo}
                        onScrollToQuotedMessage={scrollToMessage}
                        resolveQuotedMessage={resolveQuotedMessage}
                        onError={(msg) => onReactionError?.(msg)}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </ChatThreadShell>
      )}
    </div>
  );
};
