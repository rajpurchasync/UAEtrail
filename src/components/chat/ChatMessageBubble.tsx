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
import { ChatMessageQuickReactionBar } from './ChatMessageQuickReactionBar';
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

const sideToolClass =
  'flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-50 hover:text-emerald-700 disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800';

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
  const [quickReactionsOpen, setQuickReactionsOpen] = useState(false);
  const [quickAnchor, setQuickAnchor] = useState<DOMRect | null>(null);

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

  const openMobileActions = (anchor?: MessageAnchorRect) => {
    const rect = anchor ?? bubbleRef.current?.getBoundingClientRect();
    if (rect) setActionsAnchor(rect);
  };

  const openQuickReactions = () => {
    if (!reactions) return;
    const rect = bubbleRef.current?.getBoundingClientRect() ?? null;
    setQuickAnchor(rect);
    setQuickReactionsOpen(true);
  };

  const bubbleClass = isMe
    ? 'chat-bubble-out bg-emerald-600 text-white rounded-lg rounded-br-sm'
    : 'chat-bubble-in bg-white text-gray-900 rounded-lg rounded-bl-sm shadow-sm border border-neutral-100';

  const showDmSenderAbove = !isMe && Boolean(senderLabel?.trim()) && !groupSender;
  const profilePath = groupSender ? memberProfileLink(groupSender.userId) : null;

  const showDesktopSideTools = reactions || replyEnabled;

  return (
    <div className={`flex min-w-0 flex-col gap-0 ${CHAT_BUBBLE_SHELL_CLASS}`}>
      <MessageSwipeReplyShell
        enabled={replyEnabled}
        className={CHAT_BUBBLE_SHELL_CLASS}
        onReply={triggerReply}
        onLongPress={(anchor) => openMobileActions(anchor)}
      >
        <div
          className={`group/msg flex max-w-full items-center gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {showDesktopSideTools ? (
            <div
              className={`chat-msg-hover-tools pointer-events-none hidden shrink-0 flex-col items-center justify-center gap-1 self-center opacity-0 transition-opacity md:flex md:group-hover/msg:pointer-events-auto md:group-hover/msg:opacity-100`}
            >
              {reactions ? (
                <button
                  type="button"
                  disabled={reactions.disabled}
                  onClick={openQuickReactions}
                  className={sideToolClass}
                  aria-label="Add reaction"
                  title="React"
                >
                  <Smile className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </button>
              ) : null}
              {replyEnabled ? (
                <button
                  type="button"
                  onClick={triggerReply}
                  className={sideToolClass}
                  aria-label="Reply"
                  title="Reply"
                >
                  <CornerDownLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}

          <div
            ref={bubbleRef}
            data-dm-message-id={selectorAttr === 'data-dm-message-id' ? messageId : undefined}
            data-wall-message-id={selectorAttr === 'data-wall-message-id' ? messageId : undefined}
            className={`relative w-fit ${CHAT_BUBBLE_MAX_CLASS} overflow-hidden px-3.5 py-2 text-sm leading-relaxed transition-colors ${bubbleClass} ${
              highlighted ? 'ring-2 ring-emerald-400/80' : ''
            }`}
            onContextMenu={(event) => {
              event.preventDefault();
              if (reactions) openQuickReactions();
              else if (replyEnabled) triggerReply();
            }}
          >
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
        </div>
      </MessageSwipeReplyShell>

      {reactions ? (
        <ChatMessageQuickReactionBar
          open={quickReactionsOpen}
          anchor={quickAnchor}
          activeKinds={reactions.activeKinds}
          disabled={reactions.disabled}
          onPick={reactions.onPick}
          onClose={() => setQuickReactionsOpen(false)}
        />
      ) : null}

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
      className={`mt-1 flex w-full max-w-[min(20rem,calc(100vw-2rem))] flex-wrap items-center gap-1.5 ${
        isMe
          ? 'ml-auto justify-start self-end flex-row'
          : 'mr-auto justify-end self-start flex-row-reverse'
      }`}
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
