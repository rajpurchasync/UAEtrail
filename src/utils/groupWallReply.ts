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

/** @deprecated New posts use plain `body` + `replyToMessageId`. Legacy embedded quote format. */
export const formatGroupWallReplyBody = (target: GroupWallReplyTarget, text: string): string => {
  const parsed = parseGroupWallMessageBody(target.body);
  const snippetSource = parsed?.replyText ?? target.body;
  const snippet = snippetSource.trim().split('\n')[0]?.slice(0, 160) ?? '';
  return `↩[id:${target.id}] ${target.authorName}: “${snippet}”\n\n${text.trim()}`;
};

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
