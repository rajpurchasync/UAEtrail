import { describe, expect, it } from 'vitest';
import { parseExplorePeopleBrowseTab } from './useExploreBrowseUrlState';

describe('parseExplorePeopleBrowseTab', () => {
  it('maps legacy going discover to discover segment', () => {
    expect(parseExplorePeopleBrowseTab(null, 'discover')).toBe('discover');
  });

  it('accepts explicit discover peopleTab', () => {
    expect(parseExplorePeopleBrowseTab('discover', null)).toBe('discover');
  });
});
