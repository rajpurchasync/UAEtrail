import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import {
  GROUP_WALL_REACTION_EMOJI,
  GROUP_WALL_REACTION_LABEL,
  type GroupWallReactionKind,
} from '../../constants/groupReactions';
import { GroupWallReactionPicker } from './GroupWallReactionPicker';

/** Desktop hover — five one-tap reactions before the full picker. */
export const CHAT_DESKTOP_QUICK_REACTION_KINDS: readonly GroupWallReactionKind[] = [
  'like',
  'heart',
  'laugh',
  'happy',
  'mountain',
];

type ChatMessageQuickReactionBarProps = {
  open: boolean;
  anchor: DOMRect | null;
  activeKinds: Set<GroupWallReactionKind>;
  disabled?: boolean;
  onPick: (kind: GroupWallReactionKind) => void;
  onClose: () => void;
};

export const ChatMessageQuickReactionBar = ({
  open,
  anchor,
  activeKinds,
  disabled,
  onPick,
  onClose,
}: ChatMessageQuickReactionBarProps) => {
  const [fullOpen, setFullOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) {
      setFullOpen(false);
      setPosition(null);
      return;
    }
    if (!anchor) return;
    const top = Math.max(8, anchor.top - 12);
    const left = anchor.left + anchor.width / 2;
    setPosition({ top, left });
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onClose]);

  if (!open || !anchor || !position) return null;

  const pick = (kind: GroupWallReactionKind) => {
    onPick(kind);
    onClose();
  };

  return createPortal(
    <div
      ref={rootRef}
      className="fixed z-[2000] flex flex-col items-center gap-1"
      style={{ top: position.top, left: position.left, transform: 'translate(-50%, -100%)' }}
      role="dialog"
      aria-label="Quick reactions"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {fullOpen ? (
        <GroupWallReactionPicker
          activeKinds={activeKinds}
          disabled={disabled}
          onPick={pick}
          className="shadow-2xl"
        />
      ) : (
        <div className="flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white px-1.5 py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {CHAT_DESKTOP_QUICK_REACTION_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              disabled={disabled}
              onClick={() => pick(kind)}
              className={`font-emoji flex h-9 w-9 items-center justify-center rounded-full text-xl transition-colors hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-40 dark:hover:bg-neutral-800 ${
                activeKinds.has(kind) ? 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/40' : ''
              }`}
              title={GROUP_WALL_REACTION_LABEL[kind]}
              aria-label={GROUP_WALL_REACTION_LABEL[kind]}
            >
              {GROUP_WALL_REACTION_EMOJI[kind]}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setFullOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="More reactions"
            title="More"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}
    </div>,
    document.body
  );
};
