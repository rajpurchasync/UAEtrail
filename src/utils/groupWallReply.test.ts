import { describe, expect, it } from 'vitest';
import { formatGroupWallReplyBody, parseGroupWallMessageBody } from './groupWallReply';

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
});
