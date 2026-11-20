import { describe, expect, it } from 'vitest';
import {
  defaultExploreSearchBrowseState,
  parseExploreSearchBrowseState,
} from '../search/exploreSearchRouting';

describe('exploreSearchRouting defaults', () => {
  it('defaults when to this week', () => {
    expect(defaultExploreSearchBrowseState().activityDatePreset).toBe('week');
  });

  it('parses missing date as week', () => {
    expect(parseExploreSearchBrowseState(new URLSearchParams()).activityDatePreset).toBe('week');
  });

  it('respects explicit date param', () => {
    expect(
      parseExploreSearchBrowseState(new URLSearchParams('date=anyday')).activityDatePreset
    ).toBe('anyday');
  });
});