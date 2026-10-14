import { describe, expect, it } from 'vitest';
import { extractActivityIdsFromChatText, parseActivityIdFromAppPath } from './activityShareLink';

const opts = { siteOrigin: 'https://uaetrail.com', currentOrigin: 'http://localhost:5173' };

describe('parseActivityIdFromAppPath', () => {
  it('reads activity detail paths', () => {
    expect(parseActivityIdFromAppPath('/activity/act-1')).toBe('act-1');
  });

  it('reads explore pin query', () => {
    expect(parseActivityIdFromAppPath('/explore?pin=activity%3Aact-2')).toBe('act-2');
  });
});

describe('extractActivityIdsFromChatText', () => {
  it('collects activity ids from share messages', () => {
    const body = 'Join us\nhttps://uaetrail.com/activity/act-1';
    expect(extractActivityIdsFromChatText(body, opts)).toEqual(['act-1']);
  });
});
