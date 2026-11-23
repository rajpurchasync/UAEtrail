export type GroupWallReplyTarget = {
  id: string;
  authorName: string;
  body: string;
};

export type ParsedGroupWallReply = {
  replyToMessageId: string | null;
  quoteAuthor: string;
  quoteSnippet: string;
  replyText: string;
};

const REPLY_LINE =
  /^↩(?:\[id:([^\]]+)\])?\s+([^:]+):\s*[“"](.+?)[”"]\s*(?:\n\n|\n)([\s\S]*)$/;

/** First-line snippet for quote UI (strips nested legacy reply bodies). */
export const wallMessageQuoteSnippet = (body: string): string => {
  const parsed = parseGroupWallMessageBody(body);
  const text = (parsed?.replyText ?? body).trim();
  const line = text.split('\n')[0] ?? '';
  return line.length > 160 ? `${line.slice(0, 157)}…` : line;
};

/** Parse legacy embedded quote bodies still stored in Mongo — new posts use `replyToMessageId` only. */
export const parseGroupWallMessageBody = (body: string): ParsedGroupWallReply | null => {
  const match = body.match(REPLY_LINE);
  if (!match) return null;

  return {
    replyToMessageId: match[1] ?? null,
    quoteAuthor: match[2].trim(),
    quoteSnippet: match[3],
    replyText: match[4],
  };
};
