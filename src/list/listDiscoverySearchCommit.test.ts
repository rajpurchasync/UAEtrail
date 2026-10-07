import { describe, expect, it } from 'vitest';
import {
  browseCategoriesForSearchScope,
  browseListFilterPatchForSearchScope,
} from './listDiscoverySearchCommit';

describe('listDiscoverySearchCommit', () => {
  it('maps explore scopes to list categories', () => {
    expect(browseCategoriesForSearchScope('activities')).toEqual(['trips']);
    expect(browseCategoriesForSearchScope('places')).toEqual(['venues']);
    expect(browseCategoriesForSearchScope('people')).toEqual(['trips']);
    expect(browseCategoriesForSearchScope('shops')).toEqual(['shops']);
    expect(browseCategoriesForSearchScope('agencies')).toEqual(['agencies']);
    expect(browseCategoriesForSearchScope('facilities')).toBeNull();
  });

  it('builds filter patch for people scope', () => {
    expect(browseListFilterPatchForSearchScope('people')).toEqual({
      categories: ['trips'],
      tripLookingOnly: true,
      tripTopics: [],
      placeTopics: [],
    });
  });
});
