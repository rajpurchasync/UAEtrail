import { describe, expect, it } from 'vitest';
import { exploreSearchStateSummary, resolveExploreSearchVenueRegionKeyFromLabel } from './exploreSearchVenueState';

describe('exploreSearchVenueState', () => {
  it('maps emirate labels to region keys', () => {
    expect(resolveExploreSearchVenueRegionKeyFromLabel('Dubai')).toBe('Dubai');
    expect(resolveExploreSearchVenueRegionKeyFromLabel('Ras Al Khaimah')).toBe('RAK');
  });

  it('summarizes venue regions for the hero row', () => {
    expect(exploreSearchStateSummary([])).toBe('All UAE');
    expect(exploreSearchStateSummary(['RAK'])).toBe('Ras Al Khaimah');
  });
});