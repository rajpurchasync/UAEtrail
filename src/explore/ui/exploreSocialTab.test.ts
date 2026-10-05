import { describe, expect, it } from 'vitest';
import { parseExploreSocialTab } from './useExploreBrowseUrlState';

describe('parseExploreSocialTab', () => {
  it('maps legacy going discover to discover segment', () => {
    expect(parseExploreSocialTab(null, 'discover')).toBe('discover');
  });

  it('accepts explicit discover socialTab', () => {
    expect(parseExploreSocialTab('discover', null)).toBe('discover');
  });
});
