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
  it('defaults to People / Recommended', () => {
    expect(parseCrewBrowseState(new URLSearchParams())).toEqual({
      lane: 'people',
      facet: 'recommended',
      proKind: 'all',
    });
  });

  it('reads peopleFacet for Available / Friends', () => {
    expect(stateFromUrl(null, null, 'available')).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl(null, null, 'friends')).toEqual({
      lane: 'people',
      facet: 'friends',
      proKind: 'all',
    });
  });

  it('ignores retired peopleTab lane aliases (GW-7)', () => {
    expect(stateFromUrl('available', null)).toEqual({
      lane: 'people',
      facet: 'recommended',
      proKind: 'all',
    });
    expect(stateFromUrl('going', null)).toEqual({
      lane: 'people',
      facet: 'recommended',
      proKind: 'all',
    });
    expect(stateFromUrl(null, 'buddies')).toEqual({
      lane: 'people',
      facet: 'recommended',
      proKind: 'all',
    });
  });

  it('reads professional and community lanes', () => {
    expect(stateFromUrl('professional', null)).toEqual({
      lane: 'professional',
      facet: 'recommended',
      proKind: 'all',
    });
    expect(stateFromUrl('community', null)).toEqual({
      lane: 'community',
      facet: 'recommended',
      proKind: 'all',
    });
  });

  it('parses proKind on professional lane', () => {
    expect(stateFromUrl('professional', null, undefined, 'guide')).toEqual({
      lane: 'professional',
      facet: 'recommended',
      proKind: 'guide',
    });
  });
});

describe('parseCrewBrowseState lane from peopleTab', () => {
  it('defaults to people / Recommended', () => {
    expect(parseCrewBrowseState(new URLSearchParams()).lane).toBe('people');
  });

  it('ignores non-lane peopleTab tokens (GW-7 canonical only)', () => {
    expect(laneFromPeopleTab('going')).toBe('people');
    expect(facetFromPeopleTab('going')).toBe('recommended');
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
  });
});