import { describe, expect, it } from 'vitest';
import { parseCrewBrowseState, serializeCrewBrowseLane } from './crewBrowseState';
import { parseCrewBrowseTab, serializeCrewBrowseTab } from './crewBrowseTab';
import { readPeopleCrewsTabParam } from '../routing/productUrlInbound';

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

  it('maps legacy available to People facet', () => {
    expect(stateFromUrl('available', null)).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
    expect(stateFromUrl('looking', null)).toEqual({
      lane: 'people',
      facet: 'available',
      proKind: 'all',
    });
  });

  it('maps legacy going to friends facet', () => {
    expect(stateFromUrl('going', null)).toEqual({
      lane: 'people',
      facet: 'friends',
      proKind: 'all',
    });
  });

  it('maps hub and buddies to Recommended', () => {
    expect(stateFromUrl('hub', null)).toEqual({
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
    expect(stateFromUrl('guides', null)).toEqual({
      lane: 'professional',
      facet: 'recommended',
      proKind: 'guide',
    });
    expect(stateFromUrl('agencies', null)).toEqual({
      lane: 'professional',
      facet: 'recommended',
      proKind: 'agency',
    });
  });
});

describe('parseCrewBrowseTab (lane only)', () => {
  it('defaults to people', () => {
    expect(parseCrewBrowseTab(null)).toBe('people');
  });

  it('reads peopleTab', () => {
    expect(tabFromUrlParam('going')).toBe('people');
    expect(tabFromUrlParam('looking')).toBe('people');
  });
});

const tabFromUrlParam = (peopleTab: string) => {
  const params = new URLSearchParams();
  params.set('peopleTab', peopleTab);
  return parseCrewBrowseTab(readPeopleCrewsTabParam(params));
};

describe('serializeCrewBrowseTab', () => {
  it('omits default people lane', () => {
    expect(serializeCrewBrowseTab('people')).toBeNull();
    expect(serializeCrewBrowseLane('people')).toBeNull();
    expect(serializeCrewBrowseTab('professional')).toBe('professional');
  });
});