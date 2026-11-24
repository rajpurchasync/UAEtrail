import { describe, expect, it } from 'vitest';
import { findCrewNavToBrowsePatch, parseFindCrewRecommendedLaneFromBrowse } from './findCrewNavWire';

describe('findCrewNavWire', () => {
  it('maps recommended tabs to browse lanes', () => {
    expect(findCrewNavToBrowsePatch('people').crewBrowseLane).toBe('people');
    expect(findCrewNavToBrowsePatch('community').crewBrowseLane).toBe('community');
    expect(findCrewNavToBrowsePatch('trips').crewBrowseLane).toBe('trips');
    expect(findCrewNavToBrowsePatch('trips').tripAvailabilityOnly).toBe(false);
  });

  it('folds professional lane into people on Find crew', () => {
    expect(parseFindCrewRecommendedLaneFromBrowse({ lane: 'professional' })).toBe('people');
  });
});