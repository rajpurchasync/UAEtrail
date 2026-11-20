import { beforeEach, describe, expect, it } from 'vitest';
import {
  EXPLORE_HUB_HOME_SCOPE_KEY,
  EXPLORE_HUB_LAST_SEARCH_KEY,
  exploreSearchStorageScope,
  readExploreHubHomeScope,
  readExploreHubLastSearch,
  readExploreRecentSearches,
  writeExploreHubHomeScope,
  writeExploreHubLastSearch,
} from './exploreHubLastSearch';

describe('exploreHubLastSearch', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('round-trips last search and home scope for a scope bucket', () => {
    const scope = exploreSearchStorageScope('member-1');
    writeExploreHubLastSearch(
      {
        query: 'Fujairah',
        activityDatePreset: 'week',
        hubMode: 'join',
      },
      scope
    );
    expect(readExploreHubLastSearch(scope)?.query).toBe('Fujairah');

    writeExploreHubHomeScope('places', scope);
    expect(readExploreHubHomeScope(scope)).toBe('places');
    expect(sessionStorage.getItem(`${EXPLORE_HUB_LAST_SEARCH_KEY}:${scope}`)).toBeTruthy();
    expect(sessionStorage.getItem(`${EXPLORE_HUB_HOME_SCOPE_KEY}:${scope}`)).toBe('places');
  });

  it('keeps up to 3 recent searches newest first', () => {
    const scope = exploreSearchStorageScope('member-1');
    writeExploreHubLastSearch(
      {
        query: 'Dubai',
        activityDatePreset: 'week',
        hubMode: 'join',
      },
      scope
    );
    writeExploreHubLastSearch(
      {
        query: 'Fujairah',
        activityDatePreset: 'month',
        hubMode: 'join',
      },
      scope
    );
    writeExploreHubLastSearch(
      {
        query: 'Dubai',
        activityDatePreset: 'week',
        hubMode: 'join',
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
    writeExploreHubLastSearch(
      { query: 'Dubai', activityDatePreset: 'week', hubMode: 'join' },
      member
    );
    writeExploreHubLastSearch(
      { query: 'Guest spot', activityDatePreset: 'anyday', hubMode: 'join' },
      guest
    );
    expect(readExploreRecentSearches(3, member)[0]?.query).toBe('Dubai');
    expect(readExploreRecentSearches(3, guest)[0]?.query).toBe('Guest spot');
  });
});