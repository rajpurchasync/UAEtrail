import { parseGroupWallMessageBody } from '../../utils/groupWallReply';
import { chatMessageTextClassName } from './chatMessageText';

type GroupWallMessageBodyProps = {
  body: string;
  replyToMessageId?: string | null;
  onScrollToQuotedMessage?: (messageId: string) => void;
};

export const GroupWallMessageBody = ({
  body,
  replyToMessageId: replyToMessageIdProp,
  onScrollToQuotedMessage,
}: GroupWallMessageBodyProps) => {
  const parsed = parseGroupWallMessageBody(body);

  if (!parsed) {
    return (
      <p className={`mt-1 text-neutral-800 ${chatMessageTextClassName}`}>{body}</p>
    );
  }

  const { replyToMessageId: parsedReplyId, quoteAuthor, quoteSnippet, replyText } = parsed;
  const replyToMessageId = replyToMessageIdProp ?? parsedReplyId;
  const canJump = Boolean(replyToMessageId && onScrollToQuotedMessage);

  const quoteClass =
    'mb-2 min-w-0 max-w-full rounded-xl border border-emerald-200/80 border-l-4 border-l-emerald-500 bg-emerald-50/90 px-3 py-2 text-left transition-colors';

  return (
    <div className="mt-1 min-w-0 max-w-full space-y-2">
      {canJump ? (
        <button
          type="button"
          onClick={() => onScrollToQuotedMessage!(replyToMessageId!)}
          className={`${quoteClass} hover:bg-emerald-100/90 active:bg-emerald-100`}
        >
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Replying to</span>
          <span className="block text-xs font-semibold text-emerald-950">{quoteAuthor}</span>
          <span className={`mt-0.5 block line-clamp-2 text-xs text-emerald-900/90 ${chatMessageTextClassName}`}>
            {quoteSnippet}
          </span>
        </button>
      ) : (
        <div className={quoteClass} aria-label="Quoted message">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Replying to</span>
          <span className="block text-xs font-semibold text-emerald-950">{quoteAuthor}</span>
          <span className={`mt-0.5 block line-clamp-2 text-xs text-emerald-900/90 ${chatMessageTextClassName}`}>
            {quoteSnippet}
          </span>
        </div>
      )}
      <p className={`text-neutral-800 ${chatMessageTextClassName}`}>{replyText}</p>
    </div>
  );
};
