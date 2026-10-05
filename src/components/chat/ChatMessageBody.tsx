import {
  parseGroupWallMessageBody,
  wallMessageQuoteSnippet,
  type GroupWallReplyTarget,
} from '../../utils/groupWallReply';
import { chatMessageTextClassName } from './chatMessageText';
import { ChatLinkedText } from './ChatLinkedText';

type QuotedWallMessage = Pick<GroupWallReplyTarget, 'authorName' | 'body'>;

type ReplyPreview = {
  messageId: string;
  authorDisplayName: string;
  bodySnippet: string;
};

export type ChatMessageBodyProps = {
  body: string;
  replyToMessageId?: string | null;
  replyToPreview?: ReplyPreview | null;
  resolveQuotedMessage?: (messageId: string) => QuotedWallMessage | null;
  onScrollToQuotedMessage?: (messageId: string) => void;
  tone?: 'default' | 'onPrimary';
};

const QuoteBlock = ({
  quoteAuthor,
  quoteSnippet,
  replyToMessageId,
  onScrollToQuotedMessage,
  tone = 'default',
}: {
  quoteAuthor: string;
  quoteSnippet: string;
  replyToMessageId: string | null;
  onScrollToQuotedMessage?: (messageId: string) => void;
  tone?: 'default' | 'onPrimary';
}) => {
  const quoteClass =
    tone === 'onPrimary'
      ? 'mb-2 min-w-0 max-w-full rounded-xl border border-white/25 border-l-4 border-l-white/70 bg-white/15 px-3 py-2 text-left transition-colors'
      : 'mb-2 min-w-0 max-w-full rounded-xl border border-emerald-200/80 border-l-4 border-l-emerald-500 bg-emerald-50/90 px-3 py-2 text-left transition-colors';
  const labelClass =
    tone === 'onPrimary'
      ? 'block text-[11px] font-semibold uppercase tracking-wide text-emerald-100'
      : 'block text-[11px] font-semibold uppercase tracking-wide text-emerald-700';
  const authorClass =
    tone === 'onPrimary' ? 'block text-xs font-semibold text-white' : 'block text-xs font-semibold text-emerald-950';
  const snippetClass =
    tone === 'onPrimary'
      ? 'mt-0.5 block line-clamp-2 text-xs leading-snug text-emerald-50/95'
      : 'mt-0.5 block line-clamp-2 text-xs leading-snug text-emerald-900/90';
  const canJump = Boolean(replyToMessageId && onScrollToQuotedMessage);

  if (canJump) {
    return (
      <button
        type="button"
        onClick={() => onScrollToQuotedMessage!(replyToMessageId!)}
        className={`${quoteClass} ${tone === 'onPrimary' ? 'hover:bg-white/20 active:bg-white/25' : 'hover:bg-emerald-100/90 active:bg-emerald-100'}`}
      >
        <span className={labelClass}>Replying to</span>
        <span className={authorClass}>{quoteAuthor}</span>
        <span className={snippetClass}>{quoteSnippet}</span>
      </button>
    );
  }

  return (
    <div className={quoteClass} aria-label="Quoted message">
      <span className={labelClass}>Replying to</span>
      <span className={authorClass}>{quoteAuthor}</span>
      <span className={snippetClass}>{quoteSnippet}</span>
    </div>
  );
};

const MessageText = ({
  text,
  tone,
  className = '',
}: {
  text: string;
  tone: 'default' | 'onPrimary';
  className?: string;
}) => (
  <p
    className={`${className} ${tone === 'onPrimary' ? 'text-white' : 'text-neutral-800'} ${chatMessageTextClassName}`.trim()}
  >
    <ChatLinkedText text={text} tone={tone} />
  </p>
);

export const ChatMessageBody = ({
  body,
  replyToMessageId: replyToMessageIdProp,
  replyToPreview,
  resolveQuotedMessage,
  onScrollToQuotedMessage,
  tone = 'default',
}: ChatMessageBodyProps) => {
  const parsed = parseGroupWallMessageBody(body);
  const serverReplyId = replyToMessageIdProp?.trim() || null;

  if (serverReplyId && replyToPreview && !parsed) {
    return (
      <div className="mt-1 min-w-0 max-w-full space-y-2">
        <QuoteBlock
          quoteAuthor={replyToPreview.authorDisplayName}
          quoteSnippet={replyToPreview.bodySnippet}
          replyToMessageId={replyToPreview.messageId}
          onScrollToQuotedMessage={onScrollToQuotedMessage}
          tone={tone}
        />
        <MessageText text={body} tone={tone} />
      </div>
    );
  }

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
            tone={tone}
          />
          <MessageText text={body} tone={tone} />
        </div>
      );
    }
  }

  if (!parsed) {
    return (
      <MessageText text={body} tone={tone} className="mt-1" />
    );
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
        tone={tone}
      />
      <MessageText text={replyText} tone={tone} />
    </div>
  );
};
