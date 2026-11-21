import { describe, expect, it } from 'vitest';
import { resolveExploreSearchDetectedWhereQuery } from './exploreSearchDetectedWhere';

describe('resolveExploreSearchDetectedWhereQuery', () => {
  it('returns empty when no location signals exist (UI shows Everywhere / placeholder)', () => {
    expect(resolveExploreSearchDetectedWhereQuery()).toBe('');
  });
});