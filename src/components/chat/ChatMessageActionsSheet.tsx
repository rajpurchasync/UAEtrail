import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CornerDownLeft, MoreHorizontal } from 'lucide-react';
import type { GroupWallReactionKind } from '../../constants/groupReactions';
import {
  GROUP_WALL_QUICK_REACTION_KINDS,
  GROUP_WALL_REACTION_EMOJI,
  GROUP_WALL_REACTION_LABEL,
} from '../../constants/groupReactions';
import { GroupWallReactionPicker } from './GroupWallReactionPicker';

export type MessageAnchorRect = Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>;

type ChatMessageActionsSheetProps = {
  open: boolean;
  anchor: MessageAnchorRect | null;
  onClose: () => void;
  onReply: () => void;
  replyEnabled?: boolean;
  reactions?: {
    activeKinds: Set<GroupWallReactionKind>;
    disabled?: boolean;
    onPick: (kind: GroupWallReactionKind) => void;
  };
};

/** Long-press menu: reply + quick reactions + full emoji picker. */
export const ChatMessageActionsSheet = ({
  open,
  anchor,
  onClose,
  onReply,
  replyEnabled = true,
  reactions,
}: ChatMessageActionsSheetProps) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [fullPickerOpen, setFullPickerOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open) {
      setFullPickerOpen(false);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setPosition(null);
      return;
    }

    const centerX = anchor.left + anchor.width / 2;
    const centerY = anchor.top + anchor.height / 2;
    const cardW = Math.min(300, window.innerWidth - 24);
    const cardH = reactions ? (fullPickerOpen ? 220 : 120) : 72;
    const margin = 12;

    let left = centerX;
    let top = centerY;

    const halfW = cardW / 2;
    left = Math.min(Math.max(halfW + margin, left), window.innerWidth - halfW - margin);
    top = Math.min(Math.max(cardH / 2 + margin, top), window.innerHeight - cardH / 2 - margin);

    setPosition({ top, left });
  }, [open, anchor, reactions, fullPickerOpen]);

  if (!open || !anchor || !position) return null;

  const handleReply = () => {
    onClose();
    if (replyEnabled) onReply();
  };

  const pickReaction = (kind: GroupWallReactionKind) => {
    reactions?.onPick(kind);
    onClose();
  };

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[1650] bg-black/35"
        aria-label="Close message actions"
        onClick={onClose}
      />
      <div
        className="fixed z-[1651] w-[300px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl"
        role="dialog"
        aria-label="Message actions"
        style={{
          top: position.top,
          left: position.left,
          transform: 'translate(-50%, -50%)',
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!replyEnabled}
            onClick={handleReply}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CornerDownLeft className="h-5 w-5" aria-hidden />
            </span>
            Reply
          </button>

          {reactions ? (
            <>
              <span className="h-8 w-px shrink-0 bg-neutral-200" aria-hidden />
              {GROUP_WALL_QUICK_REACTION_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  disabled={reactions.disabled}
                  onClick={() => pickReaction(kind)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl font-emoji transition-colors hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-40 ${
                    reactions.activeKinds.has(kind) ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''
                  }`}
                  title={GROUP_WALL_REACTION_LABEL[kind]}
                  aria-label={GROUP_WALL_REACTION_LABEL[kind]}
                >
                  {GROUP_WALL_REACTION_EMOJI[kind]}
                </button>
              ))}
              <button
                type="button"
                disabled={reactions.disabled}
                onClick={() => setFullPickerOpen((open) => !open)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-40"
                aria-label="More reactions"
                aria-expanded={fullPickerOpen}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : null}
        </div>

        {reactions && fullPickerOpen ? (
          <div className="mt-2 border-t border-neutral-100 pt-2">
            <GroupWallReactionPicker
              activeKinds={reactions.activeKinds}
              disabled={reactions.disabled}
              onPick={pickReaction}
              className="w-full max-w-none shadow-none border-0 p-0"
            />
          </div>
        ) : null}
      </div>
    </>,
    document.body
  );
};
