import { useState } from 'react';
import type { ChatMessageDTO } from '@uaetrail/shared-types';
import { CornerDownRight } from 'lucide-react';
import { GroupWallMessageBody } from './GroupWallMessageBody';
import { MessageSwipeReplyShell } from './MessageSwipeReplyShell';
import { ChatMessageActionsSheet } from './ChatMessageActionsSheet';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';

type DirectMessageBubbleProps = {
  message: ChatMessageDTO;
  isMe: boolean;
  partnerDisplayName: string;
  highlighted?: boolean;
  onReply: (target: GroupWallReplyTarget) => void;
  onScrollToQuotedMessage?: (messageId: string) => void;
  resolveQuotedMessage?: (messageId: string) => Pick<GroupWallReplyTarget, 'authorName' | 'body'> | null;
};

export const DirectMessageBubble = ({
  message,
  isMe,
  partnerDisplayName,
  highlighted = false,
  onReply,
  onScrollToQuotedMessage,
  resolveQuotedMessage,
}: DirectMessageBubbleProps) => {
  const [actionsOpen, setActionsOpen] = useState(false);

  const authorName = isMe ? 'You' : partnerDisplayName;
  const replyTarget: GroupWallReplyTarget = {
    id: message.id,
    authorName,
    body: message.content,
  };

  const triggerReply = () => onReply(replyTarget);

  const bubbleClass = isMe
    ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md'
    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-neutral-100';

  return (
    <>
      <MessageSwipeReplyShell
        enabled
        onReply={triggerReply}
        onLongPress={() => setActionsOpen(true)}
      >
        <div
          data-dm-message-id={message.id}
          className={`group/msg relative min-w-0 max-w-[min(75%,100%)] overflow-hidden px-3.5 py-2 text-sm leading-relaxed transition-colors ${bubbleClass} ${
            highlighted ? 'ring-2 ring-emerald-400/80' : ''
          }`}
          onContextMenu={(event) => {
            event.preventDefault();
            setActionsOpen(true);
          }}
        >
          <div
            className="absolute right-1.5 top-1.5 z-10 hidden md:flex md:pointer-events-none md:opacity-0 md:transition-opacity md:group-hover/msg:pointer-events-auto md:group-hover/msg:opacity-100"
          >
            <button
              type="button"
              onClick={triggerReply}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                isMe ? 'text-emerald-50 hover:bg-white/15' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <CornerDownRight className="h-3.5 w-3.5" aria-hidden />
              Reply
            </button>
          </div>

          <GroupWallMessageBody
            body={message.content}
            replyToMessageId={message.replyToMessageId}
            replyToPreview={message.replyToPreview}
            resolveQuotedMessage={resolveQuotedMessage}
            onScrollToQuotedMessage={onScrollToQuotedMessage}
            tone={isMe ? 'onPrimary' : 'default'}
          />

          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
            <span className={`text-xs ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isMe && message.readAt && <span className="text-xs text-emerald-200">✓✓</span>}
          </div>
        </div>
      </MessageSwipeReplyShell>

      <ChatMessageActionsSheet
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        onReply={triggerReply}
      />
    </>
  );
};
