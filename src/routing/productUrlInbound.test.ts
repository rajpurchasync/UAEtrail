import { describe, expect, it } from 'vitest';
import {
  INBOUND_ACTIVITY_MODE_SEEKING,
  INBOUND_LIST_FILTER_LOOKING,
  canonicalizeExplorePinKindToken,
  listFilterMeansAvailabilityOnly,
  mapInboundPeopleBrowseTabValue,
  sanitizeInboundExplorePinId,
  stripRetiredExploreOverlayParams,
  normalizeExploreSearchScopeInbound,
  parseInboundExploreActivityMode,
  readExploreSearchScopeParam,
  readPeopleCrewsTabParam,
} from './productUrlInbound';

describe('productUrlInbound', () => {
  it('list availability filter accepts canonical + retired looking', () => {
    expect(listFilterMeansAvailabilityOnly(INBOUND_LIST_FILTER_LOOKING)).toBe(true);
    expect(listFilterMeansAvailabilityOnly('availability')).toBe(true);
    expect(listFilterMeansAvailabilityOnly('hiking')).toBe(false);
  });

  it('activityMode seeking maps to availability', () => {
    expect(parseInboundExploreActivityMode(INBOUND_ACTIVITY_MODE_SEEKING)).toBe('availability');
    expect(parseInboundExploreActivityMode('hosted')).toBe('hosted');
  });

  it('pinKind inbound tokens canonicalize to activities/places', () => {
    expect(canonicalizeExplorePinKindToken('looking')).toBe('activities');
    expect(canonicalizeExplorePinKindToken('trips')).toBe('activities');
    expect(canonicalizeExplorePinKindToken('locations')).toBe('places');
  });

  it('search scope normalizes retired tokens', () => {
    expect(normalizeExploreSearchScopeInbound('demand')).toBe('people');
    expect(normalizeExploreSearchScopeInbound('buddies')).toBe('people');
    expect(normalizeExploreSearchScopeInbound('trip')).toBe('activities');
    expect(readExploreSearchScopeParam(new URLSearchParams('searchFocus=people'))).toBe('people');
  });

  it('crews tab param read prefers peopleTab', () => {
    expect(readPeopleCrewsTabParam(new URLSearchParams('peopleTab=going'))).toBe('going');
    expect(readPeopleCrewsTabParam(new URLSearchParams('buddies=available'))).toBe('available');
    expect(readPeopleCrewsTabParam(new URLSearchParams('socialTab=connect'))).toBe('connect');
    expect(readPeopleCrewsTabParam(new URLSearchParams('goingTab=people'))).toBe('going');
    expect(readPeopleCrewsTabParam(new URLSearchParams('goingTab=discover'))).toBe('available');
  });

  it('sanitizes retired map pins and overlay query keys', () => {
    expect(sanitizeInboundExplorePinId('demand:int-1')).toBeNull();
    expect(sanitizeInboundExplorePinId('availability:u1:s1')).toBe('availability:u1:s1');
    const params = new URLSearchParams('fulfillIntent=1&hostDemand=1&list=1');
    stripRetiredExploreOverlayParams(params);
    expect(params.get('fulfillIntent')).toBeNull();
    expect(params.get('list')).toBe('1');
  });

  it('maps retired peopleTab values', () => {
    expect(mapInboundPeopleBrowseTabValue('discover')).toBe('available');
    expect(mapInboundPeopleBrowseTabValue('buddies')).toBe('hub');
  });
});