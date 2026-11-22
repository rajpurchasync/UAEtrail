import { describe, expect, it } from 'vitest';
import {
  parseExploreCrewBrowseState,
  parsePeopleListBrowseState,
  parsePeopleListBrowseTab,
  serializePeopleListBrowseState,
} from './peopleListBrowseUrl';

describe('peopleListBrowseUrl', () => {
  it('parses URL with People default on crews list', () => {
    expect(parsePeopleListBrowseState(new URLSearchParams('listCat=people'))).toEqual({
      lane: 'people',
      facet: 'recommended',
    });
    expect(parsePeopleListBrowseTab(null)).toBe('people');
  });

  it('maps inbound buddies to People Recommended', () => {
    expect(parsePeopleListBrowseTab('buddies')).toBe('people');
    expect(
      parsePeopleListBrowseState(new URLSearchParams('listCat=people&buddies=looking'))
    ).toEqual({ lane: 'people', facet: 'available' });
  });

  it('parseExploreCrewBrowseState reads peopleTab and facet', () => {
    expect(parseExploreCrewBrowseState(new URLSearchParams('view=people'))).toEqual({
      lane: 'people',
      facet: 'recommended',
    });
    expect(
      parseExploreCrewBrowseState(new URLSearchParams('view=people&peopleTab=professional'))
    ).toEqual({ lane: 'professional', facet: 'recommended' });
    expect(
      parseExploreCrewBrowseState(new URLSearchParams('view=people&peopleFacet=friends'))
    ).toEqual({ lane: 'people', facet: 'friends' });
  });

  it('serializes non-default lane and facet', () => {
    expect(serializePeopleListBrowseState({ lane: 'people', facet: 'recommended' })).toEqual({
      peopleTab: null,
      peopleFacet: null,
    });
    expect(serializePeopleListBrowseState({ lane: 'people', facet: 'friends' })).toEqual({
      peopleTab: null,
      peopleFacet: 'friends',
    });
    expect(serializePeopleListBrowseState({ lane: 'professional', facet: 'recommended' })).toEqual({
      peopleTab: 'professional',
      peopleFacet: null,
    });
  });
});