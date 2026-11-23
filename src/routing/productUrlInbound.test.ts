import { describe, expect, it } from 'vitest';
import {
  canonicalizeExplorePinKindToken,
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

  it('pinKind tokens pass through unchanged', () => {
    expect(canonicalizeExplorePinKindToken('activities')).toBe('activities');
    expect(canonicalizeExplorePinKindToken('looking')).toBe('looking');
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