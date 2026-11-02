import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatExploreClockFromDate } from '@uaetrail/shared-types';
import { memberProfileLink } from '../../member/memberProfileLink';
import { CornerDownLeft, Smile } from 'lucide-react';
import { chatParticipantNameColorClass } from '../../utils/chatParticipantColor';
import { profileReturnNavState } from '../../utils/profileReturnNav';
import type { GroupWallReactionKind } from '../../constants/groupReactions';
import {
  GROUP_WALL_REACTION_EMOJI,
  GROUP_WALL_REACTION_LABEL,
} from '../../constants/groupReactions';
import { ChatMessageBody } from './ChatMessageBody';
import { MessageSwipeReplyShell } from './MessageSwipeReplyShell';
import {
  ChatMessageActionsSheet,
  type MessageAnchorRect,
} from './ChatMessageActionsSheet';
import { CHAT_BUBBLE_MAX_CLASS, CHAT_BUBBLE_SHELL_CLASS } from './chatMessageLayout';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';
import type { ChatThreadMessageSelectorAttr } from './useThreadReply';

type ReplyPreview = {
  messageId: string;
  authorDisplayName: string;
  bodySnippet: string;
};

export type ChatMessageBubbleProps = {
  messageId: string;
  selectorAttr: ChatThreadMessageSelectorAttr;
  isMe: boolean;
  /** Shown above incoming bubbles (DM). */
  senderLabel?: string;
  /** Group chat: bold, color-coded, tappable name above the bubble. */
  groupSender?: {
    displayName: string;
    userId: string;
    chatReturnTo: string;
  };
  body: string;
  createdAt: string;
  readAt?: string | null;
  highlighted?: boolean;
  replyEnabled?: boolean;
  replyToMessageId?: string | null;
  replyToPreview?: ReplyPreview | null;
  resolveQuotedMessage?: (messageId: string) => Pick<GroupWallReplyTarget, 'authorName' | 'body'> | null;
  onScrollToQuotedMessage?: (messageId: string) => void;
  onReply: (target: GroupWallReplyTarget) => void;
  reactions?: {
    activeKinds: Set<GroupWallReactionKind>;
    disabled?: boolean;
    onPick: (kind: GroupWallReactionKind) => void;
  };
};

export const ChatMessageBubble = ({
  messageId,
  selectorAttr,
  isMe,
  senderLabel,
  groupSender,
  body,
  createdAt,
  readAt,
  highlighted = false,
  replyEnabled = true,
  replyToMessageId,
  replyToPreview,
  resolveQuotedMessage,
  onScrollToQuotedMessage,
  onReply,
  reactions,
}: ChatMessageBubbleProps) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [actionsAnchor, setActionsAnchor] = useState<MessageAnchorRect | null>(null);

  const authorName = isMe ? 'You' : senderLabel?.trim() || 'Member';
  const replyTarget: GroupWallReplyTarget = {
    id: messageId,
    authorName,
    body,
  };

  const triggerReply = () => {
    if (!replyEnabled) return;
    onReply(replyTarget);
  };

  const openActions = (anchor?: MessageAnchorRect) => {
    const rect = anchor ?? bubbleRef.current?.getBoundingClientRect();
    if (rect) setActionsAnchor(rect);
  };

  const bubbleClass = isMe
    ? 'chat-bubble-out bg-emerald-600 text-white rounded-lg rounded-br-sm'
    : 'chat-bubble-in bg-white text-gray-900 rounded-lg rounded-bl-sm shadow-sm border border-neutral-100';

  const showDmSenderAbove = !isMe && Boolean(senderLabel?.trim()) && !groupSender;
  const profilePath = groupSender ? memberProfileLink(groupSender.userId) : null;

  return (
    <div className={`flex min-w-0 flex-col gap-0 ${CHAT_BUBBLE_SHELL_CLASS}`}>
      <MessageSwipeReplyShell
        enabled={replyEnabled}
        className={CHAT_BUBBLE_SHELL_CLASS}
        onReply={triggerReply}
        onLongPress={(anchor) => openActions(anchor)}
      >
        <div
          ref={bubbleRef}
          data-dm-message-id={selectorAttr === 'data-dm-message-id' ? messageId : undefined}
          data-wall-message-id={selectorAttr === 'data-wall-message-id' ? messageId : undefined}
          className={`group/msg relative w-fit ${CHAT_BUBBLE_MAX_CLASS} overflow-hidden px-3.5 py-2 text-sm leading-relaxed transition-colors ${bubbleClass} ${
            highlighted ? 'ring-2 ring-emerald-400/80' : ''
          }`}
          onContextMenu={(event) => {
            event.preventDefault();
            openActions();
          }}
        >
          <div
            className={`absolute right-1.5 top-1.5 z-10 hidden items-center gap-0.5 rounded-xl border p-0.5 shadow-md backdrop-blur-sm md:flex md:pointer-events-none md:opacity-0 md:transition-opacity md:group-hover/msg:pointer-events-auto md:group-hover/msg:opacity-100 ${
              isMe
                ? 'border-emerald-500/30 bg-emerald-700/90'
                : 'border-neutral-200 bg-white/95'
            }`}
          >
            <button
              type="button"
              onClick={triggerReply}
              disabled={!replyEnabled}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold disabled:opacity-40 ${
                isMe ? 'text-emerald-50 hover:bg-white/15' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />
              Reply
            </button>
            {reactions ? (
              <button
                type="button"
                disabled={reactions.disabled}
                onClick={() => openActions()}
                className={`flex min-h-[28px] min-w-[28px] items-center justify-center rounded-lg ${
                  isMe ? 'text-emerald-50 hover:bg-white/15' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                aria-label="React"
              >
                <Smile className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {groupSender && !isMe && profilePath ? (
            <Link
              to={profilePath}
              state={profileReturnNavState(groupSender.chatReturnTo, 'Chat')}
              className={`mb-0.5 block max-w-full truncate text-[13px] font-semibold leading-tight hover:underline ${chatParticipantNameColorClass(groupSender.userId)}`}
            >
              {groupSender.displayName}
            </Link>
          ) : null}
          {showDmSenderAbove ? (
            <p className="mb-0.5 truncate text-[13px] font-semibold leading-tight text-emerald-700">{senderLabel}</p>
          ) : null}

          <ChatMessageBody
            body={body}
            replyToMessageId={replyToMessageId}
            replyToPreview={replyToPreview}
            resolveQuotedMessage={resolveQuotedMessage}
            onScrollToQuotedMessage={onScrollToQuotedMessage}
            tone={isMe ? 'onPrimary' : 'default'}
          />

          <div className={`mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : ''}`}>
            <span className={`text-xs ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
              {formatExploreClockFromDate(new Date(createdAt))}
            </span>
            {isMe && readAt ? <span className="text-xs text-emerald-200">✓✓</span> : null}
          </div>
        </div>
      </MessageSwipeReplyShell>

      <ChatMessageActionsSheet
        open={actionsAnchor !== null}
        anchor={actionsAnchor}
        onClose={() => setActionsAnchor(null)}
        onReply={triggerReply}
        replyEnabled={replyEnabled}
        reactions={reactions}
      />
    </div>
  );
};

/** Reaction chips row (group wall) — below the bubble, same alignment as sender. */
export const ChatMessageReactionRow = ({
  isMe,
  reactions,
  reactionBusy = false,
  onToggle,
}: {
  isMe: boolean;
  reactions: Array<{ kind: GroupWallReactionKind; count: number; reactedByMe: boolean }>;
  reactionBusy?: boolean;
  onToggle: (kind: GroupWallReactionKind) => void;
}) => {
  if (reactions.length === 0) return null;

  return (
    <div
      className={`mt-1 flex flex-wrap items-center gap-1.5 ${CHAT_BUBBLE_SHELL_CLASS} ${isMe ? 'self-end' : 'self-start'}`}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.kind}
          type="button"
          disabled={reactionBusy}
          onClick={() => onToggle(reaction.kind)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            reaction.reactedByMe
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
          }`}
          title={GROUP_WALL_REACTION_LABEL[reaction.kind]}
        >
          <span className="font-emoji text-sm leading-normal">{GROUP_WALL_REACTION_EMOJI[reaction.kind]}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
};
