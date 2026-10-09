import { describe, expect, it } from 'vitest';
import { parseExplorePeopleBrowseTab } from './useExploreBrowseUrlState';

describe('parseExplorePeopleBrowseTab', () => {
  it('defaults to available', () => {
    expect(parseExplorePeopleBrowseTab(null, null)).toBe('available');
  });

  it('maps legacy discover to available', () => {
    expect(parseExplorePeopleBrowseTab('discover', null)).toBe('available');
    expect(parseExplorePeopleBrowseTab(null, 'discover')).toBe('available');
  });

  it('accepts primary tabs and legacy aliases', () => {
    expect(parseExplorePeopleBrowseTab('available', null)).toBe('available');
    expect(parseExplorePeopleBrowseTab('going', null)).toBe('going');
    expect(parseExplorePeopleBrowseTab('connect', null)).toBe('connect');
    expect(parseExplorePeopleBrowseTab('friends', null)).toBe('going');
    expect(parseExplorePeopleBrowseTab('all', null)).toBe('connect');
  });
});
