import { beforeEach, describe, expect, it } from 'vitest';
import {
  EXPLORE_SEARCH_HOME_SCOPE_KEY,
  EXPLORE_SEARCH_LAST_SEARCH_KEY,
  exploreSearchStorageScope,
  readExploreSearchHomeScope,
  readExploreSearchLastSearch,
  readExploreRecentSearches,
  writeExploreSearchHomeScope,
  writeExploreSearchLastSearch,
} from './exploreSearchLastSearch';

describe('exploreSearchLastSearch', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('round-trips last search and home scope for a scope bucket', () => {
    const scope = exploreSearchStorageScope('member-1');
    writeExploreSearchLastSearch(
      {
        query: 'Fujairah',
        activityDatePreset: 'week',
        searchScope: 'join',
      },
      scope
    );
    expect(readExploreSearchLastSearch(scope)?.query).toBe('Fujairah');

    writeExploreSearchHomeScope('places', scope);
    expect(readExploreSearchHomeScope(scope)).toBe('places');
    expect(sessionStorage.getItem(`${EXPLORE_SEARCH_LAST_SEARCH_KEY}:${scope}`)).toBeTruthy();
    expect(sessionStorage.getItem(`${EXPLORE_SEARCH_HOME_SCOPE_KEY}:${scope}`)).toBe('places');
  });

  it('keeps up to 3 recent searches newest first', () => {
    const scope = exploreSearchStorageScope('member-1');
    writeExploreSearchLastSearch(
      {
        query: 'Dubai',
        activityDatePreset: 'week',
        searchScope: 'join',
      },
      scope
    );
    writeExploreSearchLastSearch(
      {
        query: 'Fujairah',
        activityDatePreset: 'month',
        searchScope: 'join',
      },
      scope
    );
    writeExploreSearchLastSearch(
      {
        query: 'Dubai',
        activityDatePreset: 'week',
        searchScope: 'join',
      },
      scope
    );
    const recent = readExploreRecentSearches(3, scope);
    expect(recent).toHaveLength(2);
    expect(recent[0]?.query).toBe('Dubai');
    expect(recent[1]?.query).toBe('Fujairah');
  });

  it('isolates guest vs member recent searches', () => {
    const member = exploreSearchStorageScope('member-1');
    const guest = exploreSearchStorageScope(null);
    writeExploreSearchLastSearch(
      { query: 'Dubai', activityDatePreset: 'week', searchScope: 'join' },
      member
    );
    writeExploreSearchLastSearch(
      { query: 'Guest spot', activityDatePreset: 'anyday', searchScope: 'join' },
      guest
    );
    expect(readExploreRecentSearches(3, member)[0]?.query).toBe('Dubai');
    expect(readExploreRecentSearches(3, guest)[0]?.query).toBe('Guest spot');
  });

  it('does not read retired hub session keys', () => {
    const scope = exploreSearchStorageScope('member-x');
    sessionStorage.setItem(
      `uaetrail:hub.lastSearch:${scope}`,
      JSON.stringify({ query: 'Sharjah', activityDatePreset: 'week', searchScope: 'join' })
    );
    expect(readExploreSearchLastSearch(scope)).toBeNull();
  });
});