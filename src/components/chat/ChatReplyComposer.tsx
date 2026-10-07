import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ChatComposeBar, type ChatComposeBarHandle } from '../ui/ChatComposeBar';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';
import { wallMessageQuoteSnippet } from '../../utils/groupWallReply';

type ChatReplyComposerProps = {
  replyTo: GroupWallReplyTarget | null;
  onCancelReply: () => void;
  /** Show quoted snippet in the reply strip (DM); group wall uses name only. */
  showQuoteSnippet?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  sending?: boolean;
  placeholder?: string;
  composeClassName?: string;
};

/** Reply banner + compose bar — shared by direct and group wall threads. */
export const ChatReplyComposer = ({
  replyTo,
  onCancelReply,
  showQuoteSnippet = true,
  value,
  onChange,
  onSend,
  sending = false,
  placeholder,
  composeClassName = '',
}: ChatReplyComposerProps) => {
  const composeRef = useRef<ChatComposeBarHandle>(null);
  const composePlaceholder =
    placeholder ?? (replyTo ? 'Write your reply…' : 'Type a message…');

  useEffect(() => {
    if (!replyTo) return;
    const frame = requestAnimationFrame(() => composeRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [replyTo?.id]);

  return (
    <>
      {replyTo ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-emerald-100 bg-emerald-50/90 px-4 py-2 text-xs text-emerald-900">
          <span className="min-w-0 flex-1 truncate">
            Replying to <span className="font-semibold">{replyTo.authorName}</span>
            {showQuoteSnippet ? (
              <span className="ml-1 text-emerald-800/80">
                · {wallMessageQuoteSnippet(replyTo.body)}
              </span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-100"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <ChatComposeBar
        ref={composeRef}
        value={value}
        onChange={onChange}
        onSend={onSend}
        sending={sending}
        placeholder={composePlaceholder}
        className={composeClassName}
      />
    </>
  );
};
