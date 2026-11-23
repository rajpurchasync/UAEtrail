import { describe, expect, it } from 'vitest';
import {
  parseExploreCrewBrowseState,
  parsePeopleListBrowseState,
  serializePeopleListBrowseState,
} from './peopleListBrowseUrl';

describe('peopleListBrowseUrl', () => {
  it('parses URL with People default on crews list', () => {
    expect(parsePeopleListBrowseState(new URLSearchParams('listCat=people'))).toEqual({
      lane: 'people',
      facet: 'recommended',
      proKind: 'all',
    });
    expect(parsePeopleListBrowseState(new URLSearchParams())).toEqual({
      lane: 'people',
      facet: 'recommended',
      proKind: 'all',
    });
  });

  it('ignores retired buddies= query (GW-7 canonical only)', () => {
    expect(
      parsePeopleListBrowseState(new URLSearchParams('listCat=people&buddies=looking'))
    ).toEqual({ lane: 'people', facet: 'recommended', proKind: 'all' });
  });

  it('parseExploreCrewBrowseState reads peopleTab and facet', () => {
    expect(parseExploreCrewBrowseState(new URLSearchParams('view=people'))).toEqual({
      lane: 'people',
      facet: 'recommended',
      proKind: 'all',
    });
    expect(
      parseExploreCrewBrowseState(new URLSearchParams('view=people&peopleTab=professional'))
    ).toEqual({ lane: 'professional', facet: 'recommended', proKind: 'all' });
    expect(
      parseExploreCrewBrowseState(new URLSearchParams('view=people&peopleFacet=friends'))
    ).toEqual({ lane: 'people', facet: 'friends', proKind: 'all' });
  });

  it('serializes non-default lane and facet', () => {
    expect(serializePeopleListBrowseState({ lane: 'people', facet: 'recommended', proKind: 'all' })).toEqual({
      peopleTab: null,
      peopleFacet: null,
      proKind: null,
    });
    expect(serializePeopleListBrowseState({ lane: 'people', facet: 'friends', proKind: 'all' })).toEqual({
      peopleTab: null,
      peopleFacet: 'friends',
      proKind: null,
    });
    expect(
      serializePeopleListBrowseState({ lane: 'professional', facet: 'recommended', proKind: 'agency' })
    ).toEqual({
      peopleTab: 'professional',
      peopleFacet: null,
      proKind: 'agency',
    });
  });
});