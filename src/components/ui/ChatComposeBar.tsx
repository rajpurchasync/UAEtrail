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
    'flex-1 min-w-0 border border-gray-200 rounded-2xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-none';

  return (
    <form
      onSubmit={handleSubmit}
      className={`chat-compose box-border flex w-full max-w-full shrink-0 items-end gap-1 gap-x-1.5 overflow-hidden border-t border-neutral-200 bg-white px-2 pb-safe pt-2 sm:px-3 ${className}`}
    >
      <EmojiPickerButton onPick={insertEmoji} disabled={sending} />
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={`${fieldClass} max-h-28`}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={fieldClass}
          enterKeyHint="send"
          autoComplete="off"
        />
      )}
      <button
        type="button"
        disabled={sending || !value.trim()}
        onClick={submitMessage}
        className="min-h-[44px] min-w-[44px] mb-0.5 flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-40 transition-colors shrink-0"
        aria-label="Send"
      >
        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </button>
    </form>
  );
});
