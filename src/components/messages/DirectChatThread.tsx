import { useCallback, useEffect, useRef } from 'react';
import { Flag, Loader2, MessageSquare } from 'lucide-react';
import type { ChatMessageDTO } from '@uaetrail/shared-types';
import { DirectMessageBubble } from './DirectMessageBubble';
import { ChatReplyComposer } from './ChatReplyComposer';
import {
  ChatMessageDateSeparator,
  shouldShowChatDateSeparator,
} from './ChatMessageDateSeparator';
import { runWithReplyTarget, useThreadReply } from './useThreadReply';
import { ChatThreadShell } from './ChatThreadShell';
import { ChatThreadHeaderBar } from './ChatThreadHeaderBar';
import { MessageAvatar } from './ChatMessageAvatar';

export type DirectChatThreadProps = {
  mobileShowThread: boolean;
  partnerUserId: string | null;
  currentUserId: string;
  partnerName: string;
  partnerAvatar?: string;
  loadingMessages: boolean;
  messages: ChatMessageDTO[];
  draft: string;
  sending: boolean;
  onBack: () => void;
  onReport: () => void;
  onDraftChange: (value: string) => void;
  onSend: (options?: { replyToMessageId?: string }) => void | Promise<void>;
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
  sending,
  onBack,
  onReport,
  onDraftChange,
  onSend,
}: DirectChatThreadProps) => {
  const prevCountRef = useRef(0);
  const skipInitialScrollRef = useRef(true);
  const {
    replyTo,
    setReplyTo,
    clearReply,
    highlightMessageId,
    scrollContainerRef: messagesContainerRef,
    scrollToMessage,
  } = useThreadReply(partnerUserId, 'data-dm-message-id');

  useEffect(() => {
    skipInitialScrollRef.current = true;
    prevCountRef.current = 0;
  }, [partnerUserId]);

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
    if (!draft.trim() || sending) return;
    await runWithReplyTarget(replyTo, setReplyTo, (replyToMessageId) =>
      onSend(replyToMessageId ? { replyToMessageId } : undefined)
    );
  };

  useEffect(() => {
    if (loadingMessages) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    if (skipInitialScrollRef.current) {
      skipInitialScrollRef.current = false;
      prevCountRef.current = messages.length;
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (messages.length > prevCountRef.current) {
      container.scrollTop = container.scrollHeight;
      prevCountRef.current = messages.length;
    }
  }, [messages.length, loadingMessages, partnerUserId, messagesContainerRef]);

  return (
    <div
      className={`flex-1 flex flex-col bg-white min-h-0 ${!mobileShowThread && !partnerUserId ? 'hidden md:flex' : 'flex'}`}
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
              sending={sending}
            />
          }
        >
          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-16 font-emoji">No messages yet. Say hello! 👋</p>
          ) : (
            <>
              {messages.map((m, i) => {
                const isMe = m.senderId === currentUserId;
                const showDate = shouldShowChatDateSeparator(m.createdAt, messages[i - 1]?.createdAt);
                return (
                  <div key={m.id}>
                    {showDate ? <ChatMessageDateSeparator isoDate={m.createdAt} /> : null}
                    <div className={`flex min-w-0 ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                      <DirectMessageBubble
                        message={m}
                        isMe={isMe}
                        partnerDisplayName={partnerName}
                        highlighted={highlightMessageId === m.id}
                        onReply={setReplyTo}
                        onScrollToQuotedMessage={scrollToMessage}
                        resolveQuotedMessage={resolveQuotedMessage}
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
