import { describe, expect, it } from 'vitest';
import {
  browseCategoriesForSearchScope,
  browseListFilterPatchForSearchScope,
} from './browseListSearchCommit';

describe('browseListSearchCommit', () => {
  it('maps explore scopes to list categories', () => {
    expect(browseCategoriesForSearchScope('activities')).toEqual(['activities']);
    expect(browseCategoriesForSearchScope('places')).toEqual(['venues']);
    expect(browseCategoriesForSearchScope('people')).toEqual(['people']);
    expect(browseCategoriesForSearchScope('shops')).toEqual(['venues']);
    expect(browseCategoriesForSearchScope('agencies')).toEqual(['agencies']);
    expect(browseCategoriesForSearchScope('facilities')).toBeNull();
  });

  it('builds filter patch for shops scope under Places', () => {
    expect(browseListFilterPatchForSearchScope('shops')).toEqual({
      categories: ['venues'],
      tripAvailabilityOnly: false,
      tripTopics: [],
      placeTopics: ['shop'],
    });
  });

  it('builds filter patch for people scope', () => {
    expect(browseListFilterPatchForSearchScope('people')).toEqual({
      categories: ['people'],
      tripAvailabilityOnly: false,
      tripTopics: [],
      placeTopics: [],
    });
  });
});
