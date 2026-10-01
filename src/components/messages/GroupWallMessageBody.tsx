import {
  parseGroupWallMessageBody,
  wallMessageQuoteSnippet,
  type GroupWallReplyTarget,
} from '../../utils/groupWallReply';
import { chatMessageTextClassName } from './chatMessageText';

type QuotedWallMessage = Pick<GroupWallReplyTarget, 'authorName' | 'body'>;

type GroupWallMessageBodyProps = {
  body: string;
  replyToMessageId?: string | null;
  resolveQuotedMessage?: (messageId: string) => QuotedWallMessage | null;
  onScrollToQuotedMessage?: (messageId: string) => void;
};

const QuoteBlock = ({
  quoteAuthor,
  quoteSnippet,
  replyToMessageId,
  onScrollToQuotedMessage,
}: {
  quoteAuthor: string;
  quoteSnippet: string;
  replyToMessageId: string | null;
  onScrollToQuotedMessage?: (messageId: string) => void;
}) => {
  const quoteClass =
    'mb-2 min-w-0 max-w-full rounded-xl border border-emerald-200/80 border-l-4 border-l-emerald-500 bg-emerald-50/90 px-3 py-2 text-left transition-colors';
  const canJump = Boolean(replyToMessageId && onScrollToQuotedMessage);

  if (canJump) {
    return (
      <button
        type="button"
        onClick={() => onScrollToQuotedMessage!(replyToMessageId!)}
        className={`${quoteClass} hover:bg-emerald-100/90 active:bg-emerald-100`}
      >
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          Replying to
        </span>
        <span className="block text-xs font-semibold text-emerald-950">{quoteAuthor}</span>
        <span
          className={`mt-0.5 block line-clamp-2 text-xs text-emerald-900/90 ${chatMessageTextClassName}`}
        >
          {quoteSnippet}
        </span>
      </button>
    );
  }

  return (
    <div className={quoteClass} aria-label="Quoted message">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
        Replying to
      </span>
      <span className="block text-xs font-semibold text-emerald-950">{quoteAuthor}</span>
      <span className={`mt-0.5 block line-clamp-2 text-xs text-emerald-900/90 ${chatMessageTextClassName}`}>
        {quoteSnippet}
      </span>
    </div>
  );
};

export const GroupWallMessageBody = ({
  body,
  replyToMessageId: replyToMessageIdProp,
  resolveQuotedMessage,
  onScrollToQuotedMessage,
}: GroupWallMessageBodyProps) => {
  const parsed = parseGroupWallMessageBody(body);
  const serverReplyId = replyToMessageIdProp?.trim() || null;

  if (serverReplyId && resolveQuotedMessage && !parsed) {
    const quoted = resolveQuotedMessage(serverReplyId);
    if (quoted) {
      return (
        <div className="mt-1 min-w-0 max-w-full space-y-2">
          <QuoteBlock
            quoteAuthor={quoted.authorName}
            quoteSnippet={wallMessageQuoteSnippet(quoted.body)}
            replyToMessageId={serverReplyId}
            onScrollToQuotedMessage={onScrollToQuotedMessage}
          />
          <p className={`text-neutral-800 ${chatMessageTextClassName}`}>{body}</p>
        </div>
      );
    }
  }

  if (!parsed) {
    return <p className={`mt-1 text-neutral-800 ${chatMessageTextClassName}`}>{body}</p>;
  }

  const { replyToMessageId: parsedReplyId, quoteAuthor, quoteSnippet, replyText } = parsed;
  const replyToMessageId = serverReplyId ?? parsedReplyId;

  return (
    <div className="mt-1 min-w-0 max-w-full space-y-2">
      <QuoteBlock
        quoteAuthor={quoteAuthor}
        quoteSnippet={quoteSnippet}
        replyToMessageId={replyToMessageId}
        onScrollToQuotedMessage={onScrollToQuotedMessage}
      />
      <p className={`text-neutral-800 ${chatMessageTextClassName}`}>{replyText}</p>
    </div>
  );
};
