import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import { EmojiPickerButton } from './EmojiPickerButton';

export type ChatComposeBarHandle = {
  focus: () => void;
};

interface ChatComposeBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  sending?: boolean;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

export const ChatComposeBar = forwardRef<ChatComposeBarHandle, ChatComposeBarProps>(function ChatComposeBar(
  {
    value,
    onChange,
    onSend,
    sending = false,
    placeholder = 'Type a message…',
    multiline = false,
    className = '',
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + emoji);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const submitMessage = () => {
    if (!value.trim() || sending) return;
    void onSend();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !sending) {
        submitMessage();
      }
    }
  };

  const fieldClass =
    'min-w-0 flex-1 border border-gray-200 rounded-2xl bg-white px-4 py-2.5 text-base resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-2 md:text-[15px] md:focus:ring-0';

  return (
    <form
      onSubmit={handleSubmit}
      className={`chat-compose box-border flex w-full max-w-full shrink-0 items-end gap-1.5 overflow-hidden border-t border-neutral-200 bg-white px-2 pb-safe pt-2 sm:px-3 md:items-center md:gap-2 md:px-4 md:py-3 ${className}`}
    >
      <EmojiPickerButton
        onPick={insertEmoji}
        disabled={sending}
        className="md:hidden"
      />
      <div className="chat-compose-field relative flex min-w-0 flex-1 items-end max-md:contents md:items-center md:rounded-lg md:border md:border-neutral-200 md:bg-[#f0f2f5] md:py-1 md:pl-1 md:pr-2 dark:md:border-neutral-700 dark:md:bg-neutral-800">
        <EmojiPickerButton
          onPick={insertEmoji}
          disabled={sending}
          variant="compact"
          className="hidden md:flex"
        />
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={`${fieldClass} max-h-28 md:pl-1`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${fieldClass} md:pl-1`}
            enterKeyHint="send"
            autoComplete="off"
          />
        )}
      </div>
      <button
        type="button"
        disabled={sending || !value.trim()}
        onClick={submitMessage}
        className="mb-0.5 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 md:mb-0"
        aria-label="Send"
      >
        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </button>
    </form>
  );
});
