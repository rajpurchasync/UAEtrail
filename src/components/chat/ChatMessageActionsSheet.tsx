import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CornerDownRight } from 'lucide-react';
import type { GroupWallReactionKind } from '../../constants/groupReactions';
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

/** Long-press menu anchored near the message center (reply + optional reactions). */
export const ChatMessageActionsSheet = ({
  open,
  anchor,
  onClose,
  onReply,
  replyEnabled = true,
  reactions,
}: ChatMessageActionsSheetProps) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setPosition(null);
      return;
    }

    const centerX = anchor.left + anchor.width / 2;
    const centerY = anchor.top + anchor.height / 2;
    const cardW = Math.min(288, window.innerWidth - 24);
    const cardH = reactions ? 200 : 88;
    const margin = 12;

    let left = centerX;
    let top = centerY;

    const halfW = cardW / 2;
    left = Math.min(Math.max(halfW + margin, left), window.innerWidth - halfW - margin);
    top = Math.min(Math.max(cardH / 2 + margin, top), window.innerHeight - cardH / 2 - margin);

    setPosition({ top, left });
  }, [open, anchor, reactions]);

  if (!open || !anchor || !position) return null;

  const handleReply = () => {
    onClose();
    if (replyEnabled) onReply();
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
        className="fixed z-[1651] w-[288px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl"
        role="dialog"
        aria-label="Message actions"
        style={{
          top: position.top,
          left: position.left,
          transform: 'translate(-50%, -50%)',
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          disabled={!replyEnabled}
          onClick={handleReply}
          className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CornerDownRight className="h-5 w-5" aria-hidden />
          </span>
          Reply
        </button>

        {reactions ? (
          <div className="mt-2 border-t border-neutral-100 pt-2">
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              React
            </p>
            <GroupWallReactionPicker
              activeKinds={reactions.activeKinds}
              disabled={reactions.disabled}
              onPick={(kind) => {
                reactions.onPick(kind);
                onClose();
              }}
              className="w-full max-w-none shadow-none border-0 p-0"
            />
          </div>
        ) : null}
      </div>
    </>,
    document.body
  );
};
