import { describe, expect, it } from 'vitest';
import { parseExploreActivityModeFilter } from '../explore/exploreActivityModeFilter';
import { parseExplorePinKindFilter } from '../explore/explorePinKindFilter';
import {
  listFilterMeansAvailabilityOnly,
  normalizeExploreSearchScopeInbound,
  parseInboundExploreActivityMode,
  readExploreSearchScopeParam,
  readPeopleCrewsTabParam,
  sanitizeInboundExplorePinId,
} from './productUrlInbound';

describe('productUrlInbound (GW-7 canonical only)', () => {
  it('list availability filter accepts canonical token only', () => {
    expect(listFilterMeansAvailabilityOnly('availability')).toBe(true);
    expect(listFilterMeansAvailabilityOnly('looking')).toBe(false);
    expect(listFilterMeansAvailabilityOnly('hiking')).toBe(false);
  });

  it('activityMode accepts hosted | availability | all only', () => {
    expect(parseInboundExploreActivityMode('seeking')).toBeNull();
    expect(parseInboundExploreActivityMode('availability')).toBe('availability');
    expect(parseInboundExploreActivityMode('hosted')).toBe('hosted');
  });

  it('search scope reads searchScope only and normalizes known keys', () => {
    expect(readExploreSearchScopeParam(new URLSearchParams('searchFocus=people'))).toBeNull();
    expect(readExploreSearchScopeParam(new URLSearchParams('searchScope=people'))).toBe('people');
    expect(normalizeExploreSearchScopeInbound('demand')).toBeNull();
    expect(normalizeExploreSearchScopeInbound('people')).toBe('people');
  });

  it('crews tab param reads peopleTab only', () => {
    expect(readPeopleCrewsTabParam(new URLSearchParams('peopleTab=professional'))).toBe('professional');
    expect(readPeopleCrewsTabParam(new URLSearchParams('buddies=available'))).toBeNull();
  });

  it('sanitizes empty pins only', () => {
    expect(sanitizeInboundExplorePinId('demand:int-1')).toBe('demand:int-1');
    expect(sanitizeInboundExplorePinId('  ')).toBeNull();
  });
});

describe('productUrlInbound delegation (R6)', () => {
  it('browse list availability filter rejects legacy looking token', () => {
    expect(listFilterMeansAvailabilityOnly('looking')).toBe(false);
    expect(listFilterMeansAvailabilityOnly('availability')).toBe(true);
  });

  it('explore activity mode filter delegates and drops retired seeking', () => {
    expect(parseExploreActivityModeFilter('seeking')).toBe('all');
    expect(parseExploreActivityModeFilter('availability')).toBe('availability');
    expect(parseExploreActivityModeFilter('hosted')).toBe('hosted');
  });

  it('explore pin kind filter accepts known lens keys only', () => {
    expect(parseExplorePinKindFilter('places')).toBe('places');
    expect(parseExplorePinKindFilter('demand')).toBe('all');
    expect(parseExplorePinKindFilter(null)).toBe('all');
  });
});