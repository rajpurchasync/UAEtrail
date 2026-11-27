import { describe, expect, it } from 'vitest';
import { parseExploreCrewBrowseState } from '../list/browse/peopleListBrowseUrl';
import { parseCrewBrowseState } from '../crew-discovery/crewBrowseTab';
import { readPeopleCrewsTabParam, PEOPLE_LIST_TAB_URL_PARAM } from './productUrlInbound';
import { BROWSE_MAIN_CATEGORY_LABELS } from '../list/browse/browseListTaxonomy';
import { EXPLORE_CREWS_PANEL_TITLE, EXPLORE_SEARCH_SCOPE_PEOPLE_LABEL } from '../content/exploreCrewsCopy';
import { PRODUCT_CREWS_TAB_LABEL } from '../content/productNorthStar';
import { MY_CREWS_PATH } from '../config/surfacePaths';

describe('crews URL inbound (R6 contract)', () => {
  it('reads canonical peopleTab via productUrlInbound only', () => {
    expect(PEOPLE_LIST_TAB_URL_PARAM).toBe('peopleTab');
    expect(readPeopleCrewsTabParam(new URLSearchParams('peopleTab=professional'))).toBe('professional');
    expect(readPeopleCrewsTabParam(new URLSearchParams('buddies=available'))).toBeNull();
  });

  it('hydrates browse crews state without legacy buddies segment params', () => {
    expect(parseCrewBrowseState(new URLSearchParams('buddies=buddies')).lane).toBe('people');
    expect(parseExploreCrewBrowseState(new URLSearchParams('peopleTab=community'))).toEqual({
      lane: 'community',
      facet: 'available',
      proKind: 'all',
    });
  });

  it('uses Crews product labels on list taxonomy and explore copy', () => {
    const peopleCategory = BROWSE_MAIN_CATEGORY_LABELS.find((row) => row.key === 'people');
    expect(peopleCategory?.label).toBe(PRODUCT_CREWS_TAB_LABEL);
    expect(EXPLORE_CREWS_PANEL_TITLE).toBe(PRODUCT_CREWS_TAB_LABEL);
    expect(EXPLORE_SEARCH_SCOPE_PEOPLE_LABEL).toBe(PRODUCT_CREWS_TAB_LABEL);
  });

  it('My Crews consumer route is /crews', () => {
    expect(MY_CREWS_PATH).toBe('/crews');
  });
});