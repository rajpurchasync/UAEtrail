import { describe, expect, it } from 'vitest';
import { appPathFromChatHref, splitChatMessageLinks } from './chatMessageLinks';

const opts = { siteOrigin: 'https://uaetrail.com', currentOrigin: 'http://localhost:5173' };

describe('splitChatMessageLinks', () => {
  it('returns plain text unchanged', () => {
    expect(splitChatMessageLinks('See you at 7', opts)).toEqual([{ kind: 'text', value: 'See you at 7' }]);
  });

  it('linkifies a shared activity URL in a share message', () => {
    const body = 'Friday hike — join this hiking outing on UAE Trail\nhttps://uaetrail.com/activity/act-1';
    const segments = splitChatMessageLinks(body, opts);
    expect(segments).toEqual([
      { kind: 'text', value: 'Friday hike — join this hiking outing on UAE Trail\n' },
      {
        kind: 'url',
        value: 'https://uaetrail.com/activity/act-1',
        href: 'https://uaetrail.com/activity/act-1',
        to: '/activity/act-1',
      },
    ]);
  });

  it('treats www URLs as https and strips trailing punctuation', () => {
    const segments = splitChatMessageLinks('Meet at www.example.com/maps.', opts);
    expect(segments).toEqual([
      { kind: 'text', value: 'Meet at ' },
      {
        kind: 'url',
        value: 'www.example.com/maps',
        href: 'https://www.example.com/maps',
        to: null,
      },
      { kind: 'text', value: '.' },
    ]);
  });

  it('keeps wrapping punctuation outside the link', () => {
    const segments = splitChatMessageLinks('Trail (https://uaetrail.com/explore)', opts);
    expect(segments[segments.length - 2]).toMatchObject({
      kind: 'url',
      to: '/explore',
      value: 'https://uaetrail.com/explore',
    });
    expect(segments[segments.length - 1]).toEqual({ kind: 'text', value: ')' });
  });

  it('maps local share URLs to in-app paths', () => {
    const segments = splitChatMessageLinks('http://localhost:5173/explore?pin=demand%3Aabc', opts);
    expect(segments).toEqual([
      {
        kind: 'url',
        value: 'http://localhost:5173/explore?pin=demand%3Aabc',
        href: 'http://localhost:5173/explore?pin=demand%3Aabc',
        to: '/explore?pin=demand%3Aabc',
      },
    ]);
  });
});

describe('appPathFromChatHref', () => {
  it('rejects external hosts', () => {
    expect(appPathFromChatHref('https://evil.example/phish', opts)).toBeNull();
  });
});
