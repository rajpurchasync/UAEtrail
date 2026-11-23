import { describe, expect, it } from 'vitest';
import { parseGroupWallMessageBody, wallMessageQuoteSnippet } from './groupWallReply';

describe('groupWallReply', () => {
  it('parses legacy reply bodies with message id', () => {
    const body = '↩[id:msg-1] Alex: “Hello crew”\n\nSee you there';
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
    const nested = '↩[id:x] A: “Hi”\n\nNested reply';
    expect(wallMessageQuoteSnippet(nested)).toBe('Nested reply');
  });
});