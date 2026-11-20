import { describe, expect, it } from 'vitest';
import { exploreHubHomeStateSummary, resolveExploreHubVenueRegionKeyFromLabel } from './exploreHubVenueState';

describe('exploreHubVenueState', () => {
  it('maps emirate labels to region keys', () => {
    expect(resolveExploreHubVenueRegionKeyFromLabel('Dubai')).toBe('Dubai');
    expect(resolveExploreHubVenueRegionKeyFromLabel('Ras Al Khaimah')).toBe('RAK');
  });

  it('summarizes venue regions for the hero row', () => {
    expect(exploreHubHomeStateSummary([])).toBe('All UAE');
    expect(exploreHubHomeStateSummary(['RAK'])).toBe('Ras Al Khaimah');
  });
});