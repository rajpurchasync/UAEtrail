import { useRef } from 'react';
import type { ChatMessageDTO } from '@uaetrail/shared-types';
import { CornerDownRight } from 'lucide-react';
import { GroupWallMessageBody } from './GroupWallMessageBody';
import { MessageSwipeReplyShell } from './MessageSwipeReplyShell';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';
const LONG_PRESS_MS = 450;
const SWIPE_CANCEL_PX = 10;

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
  const longPressTimerRef = useRef<number | null>(null);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);

  const authorName = isMe ? 'You' : partnerDisplayName;
  const replyTarget: GroupWallReplyTarget = {
    id: message.id,
    authorName,
    body: message.content,
  };

  const triggerReply = () => onReply(replyTarget);

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const onLongPressTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      triggerReply();
    }, LONG_PRESS_MS);
  };

  const onLongPressTouchMove = (event: React.TouchEvent) => {
    if (!touchOriginRef.current) return;
    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - touchOriginRef.current.x);
    const dy = Math.abs(touch.clientY - touchOriginRef.current.y);
    if (dx > SWIPE_CANCEL_PX || dy > SWIPE_CANCEL_PX) {
      clearLongPress();
    }
  };

  const onLongPressTouchEnd = () => {
    clearLongPress();
    touchOriginRef.current = null;
  };

  const bubbleClass = isMe
    ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md'
    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-neutral-100';

  return (
    <MessageSwipeReplyShell enabled onReply={triggerReply}>
      <div
        data-dm-message-id={message.id}
        className={`group/msg relative min-w-0 max-w-[min(75%,100%)] overflow-hidden px-3.5 py-2 text-sm leading-relaxed transition-colors ${bubbleClass} ${
          highlighted ? 'ring-2 ring-emerald-400/80' : ''
        }`}
        onTouchStart={onLongPressTouchStart}
        onTouchMove={onLongPressTouchMove}
        onTouchEnd={onLongPressTouchEnd}
        onTouchCancel={onLongPressTouchEnd}
        onContextMenu={(event) => {
          event.preventDefault();
          triggerReply();
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
  );
};
