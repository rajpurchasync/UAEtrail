import { describe, expect, it } from 'vitest';
import { parseExploreBrowseStateFromSearchParams } from './exploreBrowseUrlHydrate';
import { buildExploreBrowseSearchParams } from './exploreBrowseUrlSync';

describe('exploreBrowseUrlHydrate', () => {
  it('parses people browse view and round-trips through sync', () => {
    const params = new URLSearchParams('view=people&peopleTab=available&list=1');
    const state = parseExploreBrowseStateFromSearchParams(params, true);
    expect(state.listMode).toBe('default');
    expect(state.peopleBrowseOpen).toBe(true);
    expect(state.peopleBrowseTab).toBe('available');

    const next = buildExploreBrowseSearchParams({
      base: params,
      isDesktop: true,
      state: {
        mapFilter: state.mapFilter,
        activityFilter: state.activityFilter,
        venueFilter: state.venueFilter,
        panel: state.panel,
        listOpen: state.listOpen,
        browseOpen: state.browseOpen,
        query: state.query,
        venueRegions: state.venueRegions,
        activityDatePreset: state.activityDatePreset,
        activityModeFilter: state.activityModeFilter,
        buddySubtype: state.buddySubtype,
        outingTopic: state.outingTopic,
        pinKind: state.pinKind,
        topicPills: state.topicPills,
        listMode: state.listMode,
        peopleBrowseOpen: state.peopleBrowseOpen,
        searchScope: state.searchScope,
        peopleBrowseTab: state.peopleBrowseTab,
      },
      patch: {},
    });
    expect(next.get('view')).toBe('people');
    expect(next.get('peopleTab')).toBe('available');
    expect(
      parseExploreBrowseStateFromSearchParams(next, true).peopleBrowseTab
    ).toBe('available');
  });

  it('clamps invalid map filter for activities desktop tab', () => {
    const params = new URLSearchParams('filter=shops&panel=activities');
    const state = parseExploreBrowseStateFromSearchParams(params, true);
    expect(state.mapFilter).toBe('all');
  });
});
