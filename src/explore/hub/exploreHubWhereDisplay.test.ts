import { describe, expect, it } from 'vitest';
import {
  exploreHubWhereBrowseQuery,
  exploreHubWhereEffectiveQuery,
  formatExploreHubStateWithCountry,
  formatExploreHubWhereDisplay,
} from './exploreHubWhereDisplay';

describe('exploreHubWhereDisplay', () => {
  it('formats emirate with UAE suffix', () => {
    expect(formatExploreHubWhereDisplay('Dubai')).toBe('Dubai, United Arab Emirates');
    expect(formatExploreHubStateWithCountry('RAK')).toBe('Ras Al Khaimah, United Arab Emirates');
  });

  it('does not double-append suffix', () => {
    expect(formatExploreHubWhereDisplay('Dubai, United Arab Emirates')).toBe(
      'Dubai, United Arab Emirates'
    );
  });

  it('resolves effective query from detected fallback', () => {
    expect(exploreHubWhereEffectiveQuery('', 'Dubai')).toBe('Dubai');
    expect(exploreHubWhereEffectiveQuery('Hatta', 'Dubai')).toBe('Hatta');
  });

  it('strips UAE suffix for browse matching', () => {
    expect(exploreHubWhereBrowseQuery('Dubai, United Arab Emirates')).toBe('Dubai');
    expect(exploreHubWhereBrowseQuery('Dubai')).toBe('Dubai');
  });
});