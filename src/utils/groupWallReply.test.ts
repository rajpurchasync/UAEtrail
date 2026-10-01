import { describe, expect, it } from 'vitest';
import {
  formatGroupWallReplyBody,
  parseGroupWallMessageBody,
  wallMessageQuoteSnippet,
} from './groupWallReply';

describe('groupWallReply', () => {
  it('round-trips reply metadata with message id', () => {
    const body = formatGroupWallReplyBody(
      { id: 'msg-1', authorName: 'Alex', body: 'Hello crew' },
      'See you there'
    );
    const parsed = parseGroupWallMessageBody(body);
    expect(parsed?.replyToMessageId).toBe('msg-1');
    expect(parsed?.quoteAuthor).toBe('Alex');
    expect(parsed?.quoteSnippet).toBe('Hello crew');
    expect(parsed?.replyText).toBe('See you there');
  });

  it('parses legacy replies without id', () => {
    const parsed = parseGroupWallMessageBody('↩ Alex: “Hello”\n\nThanks');
    expect(parsed?.replyToMessageId).toBeNull();
    expect(parsed?.replyText).toBe('Thanks');
  });

  it('snippets plain or nested reply bodies', () => {
    expect(wallMessageQuoteSnippet('Line one\nline two')).toBe('Line one');
    const nested = formatGroupWallReplyBody(
      { id: 'x', authorName: 'A', body: 'Hi' },
      'Nested reply'
    );
    expect(wallMessageQuoteSnippet(nested)).toBe('Nested reply');
  });
});
