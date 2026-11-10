import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';
import { CHAT_EMOJI_LIST } from '../../constants/chatEmojis';

interface EmojiPickerButtonProps {
  onPick: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
  /** WhatsApp Web — smaller control inside the compose field on desktop. */
  variant?: 'default' | 'compact';
}

export const EmojiPickerButton = ({
  onPick,
  disabled,
  className = '',
  variant = 'default',
}: EmojiPickerButtonProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);

  const updatePickerPosition = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const top = Math.max(8, rect.top - 8);
    setPickerPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPickerPos(null);
      return;
    }
    updatePickerPosition();
    window.addEventListener('resize', updatePickerPosition);
    window.addEventListener('scroll', updatePickerPosition, true);
    return () => {
      window.removeEventListener('resize', updatePickerPosition);
      window.removeEventListener('scroll', updatePickerPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const portal = document.getElementById('emoji-picker-portal');
      if (portal?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-emerald-600 disabled:opacity-40 transition-colors ${
          variant === 'compact'
            ? 'min-h-[36px] min-w-[36px] md:min-h-[32px] md:min-w-[32px]'
            : 'min-h-[44px] min-w-[44px]'
        }`}
        aria-label="Insert emoji"
        title="Emoji"
        aria-expanded={open}
      >
        <Smile className="w-5 h-5" />
      </button>
      {open && pickerPos
        ? createPortal(
            <div
              id="emoji-picker-portal"
              className="fixed z-[2000] w-[min(280px,calc(100vw-2rem))] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg"
              style={{ top: pickerPos.top, left: pickerPos.left, transform: 'translateY(-100%)' }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="grid grid-cols-8 gap-0.5">
                {CHAT_EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onPick(emoji);
                      setOpen(false);
                    }}
                    className="font-emoji flex h-7 w-7 items-center justify-center rounded-md text-base leading-none hover:bg-neutral-100 active:bg-neutral-200"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};
