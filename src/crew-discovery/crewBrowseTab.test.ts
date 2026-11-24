import { describe, expect, it } from 'vitest';
import { serializeCrewBrowseLane } from './crewBrowseState';
import { parseCrewBrowseState, serializeCrewBrowseTab } from './crewBrowseTab';

const stateFromUrl = (
  peopleTab: string | null,
  buddies: string | null,
  facet?: string,
  proKind?: string
) => {
  const params = new URLSearchParams();
  if (peopleTab) params.set('peopleTab', peopleTab);
  if (buddies) params.set('buddies', buddies);
  if (facet) params.set('peopleFacet', facet);
  if (proKind) params.set('proKind', proKind);
  return parseCrewBrowseState(params);
};

describe('parseCrewBrowseState', () => {
  it('defaults to People lane + Available facet', () => {
    expect(parseCrewBrowseState(new URLSearchParams())).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
  });

  it('reads peopleFacet for Available / Everyone on People lane', () => {
    expect(stateFromUrl(null, null, 'available')).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl(null, null, 'everyone')).toEqual({
      lane: 'people',
      facet: 'everyone',
      proKind: 'all',
    });
  });

  it('migrates peopleFacet=friends and recommended to Available', () => {
    expect(stateFromUrl(null, null, 'friends')).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl(null, null, 'recommended')).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
  });

  it('ignores retired peopleTab lane aliases (GW-7)', () => {
    expect(stateFromUrl('available', null)).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl('going', null)).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl(null, 'buddies')).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
  });

  it('reads professional, community, and people lanes', () => {
    expect(stateFromUrl('people', null)).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl('recommended', null)).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl('professional', null)).toEqual({
      lane: 'professional',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl('community', null)).toEqual({
      lane: 'community',
      facet: 'available',
      proKind: 'all',
    });
  });

  it('parses proKind on professional lane', () => {
    expect(stateFromUrl('professional', null, undefined, 'guide')).toEqual({
      lane: 'professional',
      facet: 'available',
      proKind: 'guide',
    });
  });
});

describe('parseCrewBrowseState lane from peopleTab', () => {
  it('defaults to people lane', () => {
    expect(parseCrewBrowseState(new URLSearchParams()).lane).toBe('people');
  });

  it('ignores non-lane peopleTab tokens (GW-7 canonical only)', () => {
    expect(laneFromPeopleTab('going')).toBe('people');
    expect(facetFromPeopleTab('going')).toBe('available');
    expect(laneFromPeopleTab('professional')).toBe('professional');
  });
});

const laneFromPeopleTab = (peopleTab: string) => {
  const params = new URLSearchParams();
  params.set('peopleTab', peopleTab);
  return parseCrewBrowseState(params).lane;
};

const facetFromPeopleTab = (peopleTab: string) => {
  const params = new URLSearchParams();
  params.set('peopleTab', peopleTab);
  return parseCrewBrowseState(params).facet;
};

describe('serializeCrewBrowseTab', () => {
  it('omits default people lane', () => {
    expect(serializeCrewBrowseTab('people')).toBeNull();
    expect(serializeCrewBrowseLane('people')).toBeNull();
    expect(serializeCrewBrowseTab('professional')).toBe('professional');
    expect(serializeCrewBrowseTab('community')).toBe('community');
    expect(serializeCrewBrowseTab('trips')).toBe('trips');
  });
});

describe('peopleFacet active', () => {
  it('parses and serializes active on people lane', () => {
    expect(stateFromUrl(null, null, 'active')).toEqual({
      lane: 'people',
      facet: 'active',
      proKind: 'all',
    });
  });

  it('reads trips lane', () => {
    expect(stateFromUrl('trips', null)).toEqual({
      lane: 'trips',
      facet: 'available',
      proKind: 'all',
    });
  });
});