import { useState } from 'react';
import { CornerDownRight, Smile } from 'lucide-react';
import type { SocialGroupWallMessageView } from '../../api/index';
import { api } from '../../api/index';
import {
  GROUP_WALL_REACTION_EMOJI,
  GROUP_WALL_REACTION_LABEL,
  type GroupWallReactionKind,
} from '../../constants/groupReactions';
import { GroupWallMessageBody } from './GroupWallMessageBody';
import { MessageSwipeReplyShell } from './MessageSwipeReplyShell';
import { ChatMessageActionsSheet } from './ChatMessageActionsSheet';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';

export type { GroupWallReplyTarget } from '../../utils/groupWallReply';

type GroupWallMessageItemProps = {
  groupId: string;
  message: SocialGroupWallMessageView;
  isMe: boolean;
  highlighted?: boolean;
  replyEnabled?: boolean;
  onReactionsChange: (messageId: string, reactions: SocialGroupWallMessageView['reactions']) => void;
  onReply: (target: GroupWallReplyTarget) => void;
  onScrollToQuotedMessage?: (messageId: string) => void;
  resolveQuotedMessage?: (messageId: string) => Pick<GroupWallReplyTarget, 'authorName' | 'body'> | null;
  onError: (message: string) => void;
};

export const GroupWallMessageItem = ({
  groupId,
  message,
  isMe,
  onReactionsChange,
  onReply,
  onScrollToQuotedMessage,
  resolveQuotedMessage,
  onError,
  highlighted = false,
  replyEnabled = true,
}: GroupWallMessageItemProps) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);

  const reactions = message.reactions ?? [];
  const activeKinds = new Set(reactions.map((reaction) => reaction.kind));

  const toggleReaction = async (kind: GroupWallReactionKind) => {
    setReactionBusy(true);
    try {
      const res = await api.toggleMeGroupWallReaction(groupId, message.id, kind);
      onReactionsChange(message.id, res.data.reactions);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not update reaction.');
    } finally {
      setReactionBusy(false);
    }
  };

  const authorName = message.author?.displayName?.trim() || 'Member';

  const replyTarget: GroupWallReplyTarget = {
    id: message.id,
    authorName,
    body: message.body,
  };

  const triggerReply = () => {
    if (!replyEnabled) return;
    onReply(replyTarget);
  };

  const bubbleClass = isMe
    ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md'
    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-neutral-100';

  return (
    <div className="flex min-w-0 max-w-full flex-col">
      {!isMe ? (
        <p className="mb-0.5 max-w-[min(75%,100%)] truncate px-1 text-xs font-semibold text-neutral-600">
          {authorName}
        </p>
      ) : null}

      <MessageSwipeReplyShell
        enabled={replyEnabled}
        onReply={triggerReply}
        onLongPress={() => setActionsOpen(true)}
        className={isMe ? 'self-end' : 'self-start'}
      >
        <div
          data-wall-message-id={message.id}
          className={`group/msg relative min-w-0 max-w-[min(75%,100%)] overflow-hidden px-3.5 py-2 text-sm leading-relaxed transition-colors ${bubbleClass} ${
            highlighted ? 'ring-2 ring-emerald-400/80' : ''
          }`}
          onContextMenu={(event) => {
            event.preventDefault();
            setActionsOpen(true);
          }}
        >
          <div
            className={`absolute right-1.5 top-1.5 z-10 hidden items-center gap-0.5 rounded-xl border border-neutral-200 bg-white/95 p-0.5 shadow-md backdrop-blur-sm md:flex md:pointer-events-none md:opacity-0 md:transition-opacity md:group-hover/msg:pointer-events-auto md:group-hover/msg:opacity-100 ${
              isMe ? 'border-emerald-500/30 bg-emerald-700/90' : ''
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
              <CornerDownRight className="h-3.5 w-3.5" aria-hidden />
              Reply
            </button>
            <button
              type="button"
              disabled={reactionBusy}
              onClick={() => setActionsOpen(true)}
              className={`flex min-h-[28px] min-w-[28px] items-center justify-center rounded-lg ${
                isMe ? 'text-emerald-50 hover:bg-white/15' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              aria-label="React"
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>

          <GroupWallMessageBody
            body={message.body}
            replyToMessageId={message.replyToMessageId}
            replyToPreview={message.replyToPreview}
            resolveQuotedMessage={resolveQuotedMessage}
            onScrollToQuotedMessage={onScrollToQuotedMessage}
            tone={isMe ? 'onPrimary' : 'default'}
          />

          <div className={`mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : ''}`}>
            <span className={`text-xs ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </MessageSwipeReplyShell>

      {reactions.length > 0 ? (
        <div
          className={`mt-1 flex max-w-[min(75%,100%)] flex-wrap items-center gap-1.5 ${isMe ? 'self-end' : 'self-start'}`}
        >
          {reactions.map((reaction) => (
            <button
              key={`${message.id}-${reaction.kind}`}
              type="button"
              disabled={reactionBusy}
              onClick={() => void toggleReaction(reaction.kind)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                reaction.reactedByMe
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
              title={GROUP_WALL_REACTION_LABEL[reaction.kind]}
            >
              <span className="font-emoji text-sm">{GROUP_WALL_REACTION_EMOJI[reaction.kind]}</span>
              <span className="font-medium">{reaction.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <ChatMessageActionsSheet
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        onReply={triggerReply}
        replyEnabled={replyEnabled}
        reactions={{
          activeKinds,
          disabled: reactionBusy,
          onPick: (kind) => void toggleReaction(kind),
        }}
      />
    </div>
  );
};
