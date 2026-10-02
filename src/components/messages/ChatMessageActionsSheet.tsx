import { createPortal } from 'react-dom';
import { CornerDownRight } from 'lucide-react';
import type { GroupWallReactionKind } from '../../constants/groupReactions';
import { GroupWallReactionPicker } from './GroupWallReactionPicker';

type ChatMessageActionsSheetProps = {
  open: boolean;
  onClose: () => void;
  onReply: () => void;
  replyEnabled?: boolean;
  reactions?: {
    activeKinds: Set<GroupWallReactionKind>;
    disabled?: boolean;
    onPick: (kind: GroupWallReactionKind) => void;
  };
};

/** Unified long-press menu: reply + optional reactions (group crew chat). */
export const ChatMessageActionsSheet = ({
  open,
  onClose,
  onReply,
  replyEnabled = true,
  reactions,
}: ChatMessageActionsSheetProps) => {
  if (!open) return null;

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
        className="fixed inset-x-0 bottom-0 z-[1651] rounded-t-2xl border-t border-neutral-200 bg-white px-4 pt-3 pb-safe shadow-2xl"
        role="dialog"
        aria-label="Message actions"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          disabled={!replyEnabled}
          onClick={handleReply}
          className="flex w-full min-h-[48px] items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CornerDownRight className="h-5 w-5" aria-hidden />
          </span>
          Reply
        </button>

        {reactions ? (
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <p className="mb-2 px-1 text-xs font-medium text-neutral-500">React</p>
            <GroupWallReactionPicker
              activeKinds={reactions.activeKinds}
              disabled={reactions.disabled}
              onPick={(kind) => {
                reactions.onPick(kind);
                onClose();
              }}
              className="w-full max-w-none"
            />
          </div>
        ) : null}
      </div>
    </>,
    document.body
  );
};
