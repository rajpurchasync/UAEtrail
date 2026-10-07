import { describe, expect, it } from 'vitest';
import { browseCategoriesForSearchScope } from './listDiscoverySearchCommit';

describe('browseCategoriesForSearchScope', () => {
  it('maps explore scopes to list categories', () => {
    expect(browseCategoriesForSearchScope('trips')).toEqual(['trips']);
    expect(browseCategoriesForSearchScope('spots')).toEqual(['venues']);
    expect(browseCategoriesForSearchScope('shops')).toEqual(['shops']);
    expect(browseCategoriesForSearchScope('facilities')).toBeNull();
  });
});
