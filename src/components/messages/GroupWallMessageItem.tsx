import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CornerDownRight, Smile } from 'lucide-react';
import type { SocialGroupWallMessageView } from '../../api/index';
import { api } from '../../api/index';
import {
  GROUP_WALL_REACTION_EMOJI,
  GROUP_WALL_REACTION_LABEL,
  type GroupWallReactionKind,
} from '../../constants/groupReactions';
import { GROUP_WALL_REACTION_PICKER_WIDTH, GroupWallReactionPicker } from './GroupWallReactionPicker';
import { GroupWallMessageBody } from './GroupWallMessageBody';
import { MessageSwipeReplyShell } from './MessageSwipeReplyShell';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';

export type { GroupWallReplyTarget } from '../../utils/groupWallReply';
export { formatGroupWallReplyBody } from '../../utils/groupWallReply';

type GroupWallMessageItemProps = {
  groupId: string;
  message: SocialGroupWallMessageView;
  highlighted?: boolean;
  replyEnabled?: boolean;
  onReactionsChange: (messageId: string, reactions: SocialGroupWallMessageView['reactions']) => void;
  onReply: (target: GroupWallReplyTarget) => void;
  onScrollToQuotedMessage?: (messageId: string) => void;
  onError: (message: string) => void;
};

const LONG_PRESS_MS = 450;
const SWIPE_CANCEL_PX = 10;
const REACTION_PICKER_ESTIMATED_HEIGHT_PX = 148;

export const GroupWallMessageItem = ({
  groupId,
  message,
  onReactionsChange,
  onReply,
  onScrollToQuotedMessage,
  onError,
  highlighted = false,
  replyEnabled = true,
}: GroupWallMessageItemProps) => {
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [pickerPos, setPickerPos] = useState<{
    top: number;
    left: number;
    placement: 'above' | 'below';
  } | null>(null);

  const reactions = message.reactions ?? [];
  const activeKinds = new Set(reactions.map((reaction) => reaction.kind));

  const toggleReaction = async (kind: GroupWallReactionKind) => {
    setReactionBusy(true);
    try {
      const res = await api.toggleMeGroupWallReaction(groupId, message.id, kind);
      onReactionsChange(message.id, res.data.reactions);
      setReactionPickerOpen(false);
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
      setReactionPickerOpen(true);
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

  useLayoutEffect(() => {
    if (!reactionPickerOpen) {
      setPickerPos(null);
      return;
    }

    const updatePosition = () => {
      const el = messageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.min(GROUP_WALL_REACTION_PICKER_WIDTH, window.innerWidth - 16);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const roomAbove = rect.top;
      const placement = roomAbove >= REACTION_PICKER_ESTIMATED_HEIGHT_PX + 12 ? 'above' : 'below';
      const top = placement === 'above' ? rect.top - 8 : rect.bottom + 8;
      setPickerPos({ top, left, placement });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [reactionPickerOpen]);

  useEffect(() => {
    if (!reactionPickerOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-group-wall-reaction-picker]')) return;
      if (target.closest(`[data-wall-message-id="${message.id}"]`)) return;
      setReactionPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [reactionPickerOpen, message.id]);

  return (
    <MessageSwipeReplyShell enabled={replyEnabled} onReply={triggerReply}>
      <div
        ref={messageRef}
        data-wall-message-id={message.id}
        className={`group/msg relative min-w-0 max-w-full overflow-hidden rounded-2xl border bg-white px-3.5 py-2.5 shadow-sm transition-colors ${
          highlighted ? 'border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-300/60' : 'border-neutral-100'
        }`}
        onTouchStart={onLongPressTouchStart}
        onTouchMove={onLongPressTouchMove}
        onTouchEnd={onLongPressTouchEnd}
        onTouchCancel={onLongPressTouchEnd}
        onContextMenu={(event) => {
          event.preventDefault();
          setReactionPickerOpen(true);
        }}
      >
        <div
          className={`absolute right-2 top-2 z-10 hidden items-center gap-0.5 rounded-xl border border-neutral-200 bg-white/95 p-0.5 shadow-md backdrop-blur-sm md:flex md:pointer-events-none md:opacity-0 md:transition-opacity md:group-hover/msg:pointer-events-auto md:group-hover/msg:opacity-100 ${
            reactionPickerOpen ? '!flex pointer-events-auto opacity-100' : ''
          }`}
        >
          <button
            type="button"
            onClick={triggerReply}
            disabled={!replyEnabled}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
          >
            <CornerDownRight className="h-3.5 w-3.5" aria-hidden />
            Reply
          </button>
          <button
            type="button"
            disabled={reactionBusy}
            onClick={() => setReactionPickerOpen((open) => !open)}
            className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 md:flex"
            aria-label="React"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>

        {reactionPickerOpen && pickerPos
          ? createPortal(
              <div
                data-group-wall-reaction-picker
                className="fixed z-[1600]"
                style={{
                  top: pickerPos.top,
                  left: pickerPos.left,
                  transform: pickerPos.placement === 'above' ? 'translateY(-100%)' : undefined,
                }}
              >
                <GroupWallReactionPicker
                  activeKinds={activeKinds}
                  disabled={reactionBusy}
                  onPick={(kind) => void toggleReaction(kind)}
                />
              </div>,
              document.body
            )
          : null}

        <div className="flex items-start justify-between gap-2 pr-2 md:pr-20">
          <p className="min-w-0 text-xs font-semibold text-neutral-700">
            {authorName}
            <span className="ml-2 font-normal text-neutral-400">
              {new Date(message.createdAt).toLocaleString()}
            </span>
          </p>
        </div>
        <GroupWallMessageBody
          body={message.body}
          replyToMessageId={message.replyToMessageId}
          onScrollToQuotedMessage={onScrollToQuotedMessage}
        />

        {reactions.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
      </div>
    </MessageSwipeReplyShell>
  );
};
