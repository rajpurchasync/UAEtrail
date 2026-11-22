import { describe, expect, it } from 'vitest';
import {
  BROWSE_LIST_CREATE_CREW,
  BROWSE_LIST_CREATE_TRIP,
  BROWSE_LIST_CREATE_VENUE,
  resolveBrowseListCreateFabLabel,
} from './browseListCopy';

describe('resolveBrowseListCreateFabLabel', () => {
  it('follows five-tab route context on list and explore', () => {
    expect(resolveBrowseListCreateFabLabel('/list', '?listCat=venues')).toBe(BROWSE_LIST_CREATE_VENUE);
    expect(resolveBrowseListCreateFabLabel('/list', '?listCat=people')).toBe(BROWSE_LIST_CREATE_CREW);
    expect(resolveBrowseListCreateFabLabel('/list', '?listCat=activities')).toBe(BROWSE_LIST_CREATE_TRIP);
    expect(resolveBrowseListCreateFabLabel('/explore', '?panel=venues&pinKind=places')).toBe(
      BROWSE_LIST_CREATE_VENUE
    );
    expect(resolveBrowseListCreateFabLabel('/explore', '?list=1&listCat=people')).toBe(
      BROWSE_LIST_CREATE_CREW
    );
    expect(resolveBrowseListCreateFabLabel('/explore', '?view=people&list=1&listCat=people')).toBe(
      BROWSE_LIST_CREATE_CREW
    );
  });

  it('falls back to list bucket hints when tab is ambiguous', () => {
    expect(
      resolveBrowseListCreateFabLabel('/list', '', {
        explorerBucket: 'places',
      })
    ).toBe(BROWSE_LIST_CREATE_VENUE);
    expect(
      resolveBrowseListCreateFabLabel('/list', '', {
        isPeopleCategory: true,
      })
    ).toBe(BROWSE_LIST_CREATE_CREW);
  });
});
