import { useEffect, useRef, useState } from 'react';
import { CornerDownRight, Smile } from 'lucide-react';
import type { SocialGroupWallMessageView } from '../../api/index';
import { api } from '../../api/index';
import {
  GROUP_WALL_REACTION_EMOJI,
  GROUP_WALL_REACTION_LABEL,
  type GroupWallReactionKind,
} from '../../constants/groupReactions';
import { GroupWallReactionPicker } from './GroupWallReactionPicker';

export type GroupWallReplyTarget = {
  id: string;
  authorName: string;
  body: string;
};

type GroupWallMessageItemProps = {
  groupId: string;
  message: SocialGroupWallMessageView;
  onReactionsChange: (messageId: string, reactions: SocialGroupWallMessageView['reactions']) => void;
  onReply: (target: GroupWallReplyTarget) => void;
  onError: (message: string) => void;
};

export const formatGroupWallReplyBody = (target: GroupWallReplyTarget, text: string): string => {
  const snippet = target.body.trim().split('\n')[0]?.slice(0, 160) ?? '';
  return `↩ ${target.authorName}: “${snippet}”\n\n${text.trim()}`;
};

const LONG_PRESS_MS = 450;

export const GroupWallMessageItem = ({
  groupId,
  message,
  onReactionsChange,
  onReply,
  onError,
}: GroupWallMessageItemProps) => {
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

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

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const onTouchStart = () => {
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      setReactionPickerOpen(true);
    }, LONG_PRESS_MS);
  };

  const onTouchEnd = () => {
    clearLongPress();
  };

  useEffect(() => {
    if (!reactionPickerOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(`[data-wall-message-id="${message.id}"]`)) return;
      setReactionPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [reactionPickerOpen, message.id]);

  return (
    <div
      data-wall-message-id={message.id}
      className="group/msg relative rounded-2xl border border-neutral-100 bg-white px-3.5 py-2.5 shadow-sm"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
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
          onClick={() =>
            onReply({
              id: message.id,
              authorName,
              body: message.body,
            })
          }
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100"
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

      {reactionPickerOpen ? (
        <div className="absolute left-2 top-2 z-20 md:left-auto md:right-2 md:top-10">
          <GroupWallReactionPicker
            activeKinds={activeKinds}
            disabled={reactionBusy}
            onPick={(kind) => void toggleReaction(kind)}
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2 pr-2 md:pr-20">
        <p className="min-w-0 text-xs font-semibold text-neutral-700">
          {authorName}
          <span className="ml-2 font-normal text-neutral-400">
            {new Date(message.createdAt).toLocaleString()}
          </span>
        </p>
        <button
          type="button"
          onClick={() =>
            onReply({
              id: message.id,
              authorName,
              body: message.body,
            })
          }
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100 md:hidden"
        >
          Reply
        </button>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 font-emoji">{message.body}</p>

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
  );
};
