import { describe, expect, it } from 'vitest';
import { normalizeFindCrewPeopleFacet } from './findCrewPeopleFacets';

describe('findCrewPeopleFacets', () => {
  it('maps legacy friends wire to Available discover', () => {
    expect(normalizeFindCrewPeopleFacet('friends')).toBe('available');
    expect(normalizeFindCrewPeopleFacet('recommended')).toBe('available');
    expect(normalizeFindCrewPeopleFacet('active')).toBe('available');
  });
});