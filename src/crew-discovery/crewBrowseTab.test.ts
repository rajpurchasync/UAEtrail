import { describe, expect, it } from 'vitest';
import { parseCrewBrowseState, serializeCrewBrowseLane } from './crewBrowseState';
import { parseCrewBrowseTab, serializeCrewBrowseTab } from './crewBrowseTab';
import { readPeopleCrewsTabParam } from '../routing/productUrlInbound';

const stateFromUrl = (peopleTab: string | null, buddies: string | null, facet?: string) => {
  const params = new URLSearchParams();
  if (peopleTab) params.set('peopleTab', peopleTab);
  if (buddies) params.set('buddies', buddies);
  if (facet) params.set('peopleFacet', facet);
  return parseCrewBrowseState(params);
};

describe('parseCrewBrowseState', () => {
  it('defaults to People / Recommended', () => {
    expect(parseCrewBrowseState(new URLSearchParams())).toEqual({
      lane: 'people',
      facet: 'recommended',
    });
  });

  it('maps legacy available to People facet', () => {
    expect(stateFromUrl('available', null)).toEqual({ lane: 'people', facet: 'available' });
    expect(stateFromUrl('looking', null)).toEqual({ lane: 'people', facet: 'available' });
  });

  it('maps legacy going to friends facet', () => {
    expect(stateFromUrl('going', null)).toEqual({ lane: 'people', facet: 'friends' });
  });

  it('maps hub and buddies to Recommended', () => {
    expect(stateFromUrl('hub', null)).toEqual({ lane: 'people', facet: 'recommended' });
    expect(stateFromUrl(null, 'buddies')).toEqual({ lane: 'people', facet: 'recommended' });
  });

  it('reads professional and community lanes', () => {
    expect(stateFromUrl('professional', null)).toEqual({ lane: 'professional', facet: 'recommended' });
    expect(stateFromUrl('community', null)).toEqual({ lane: 'community', facet: 'recommended' });
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