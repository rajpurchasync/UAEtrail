import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { CHAT_EMOJI_LIST } from '../../constants/chatEmojis';

interface EmojiPickerButtonProps {
  onPick: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

export const EmojiPickerButton = ({ onPick, disabled, className = '' }: EmojiPickerButtonProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-emerald-600 disabled:opacity-40 transition-colors"
        aria-label="Insert emoji"
        title="Emoji"
      >
        <Smile className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-30 w-[min(280px,calc(100vw-2rem))] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-8 gap-0.5 max-h-40 overflow-y-auto">
            {CHAT_EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
                className="font-emoji h-9 w-9 rounded-lg text-xl hover:bg-neutral-100 active:bg-neutral-200"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
