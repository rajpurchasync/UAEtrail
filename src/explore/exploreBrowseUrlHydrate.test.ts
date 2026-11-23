import { describe, expect, it } from 'vitest';
import { parseExploreBrowseStateFromSearchParams } from './exploreBrowseUrlHydrate';
import { buildExploreBrowseSearchParams } from './exploreBrowseUrlSync';

describe('exploreBrowseUrlHydrate', () => {
  it('mobile view=people hydrates listMode crews (not legacy people)', () => {
    const state = parseExploreBrowseStateFromSearchParams(
      new URLSearchParams('view=people&list=1'),
      false
    );
    expect(state.listMode).toBe('crews');
    expect(state.crewsBrowseOpen).toBe(false);
  });

  it('desktop view=people without list=1 opens list drawer (no docked rail)', () => {
    const state = parseExploreBrowseStateFromSearchParams(new URLSearchParams('view=people'), true);
    expect(state.listOpen).toBe(true);
    expect(state.crewsBrowseOpen).toBe(false);
    const next = buildExploreBrowseSearchParams({
      base: new URLSearchParams('view=people'),
      isDesktop: true,
      state: {
        ...state,
        geoPath: state.geoPath,
        tripMapTopics: state.tripMapTopics,
        placeMapTopics: state.placeMapTopics,
        priceFilter: state.priceFilter,
        hasTrip: state.hasTrip,
        facilityKinds: state.facilityKinds,
      },
      patch: {},
    });
    expect(next.get('view')).toBeNull();
    expect(next.get('list')).toBe('1');
    expect(next.get('listCat')).toBe('people');
  });

  it('parses people browse view and round-trips through sync', () => {
    const params = new URLSearchParams('view=people&peopleTab=available&list=1&listCat=people');
    const state = parseExploreBrowseStateFromSearchParams(params, true);
    expect(state.listMode).toBe('default');
    expect(state.crewsBrowseOpen).toBe(false);
    expect(state.crewBrowseLane).toBe('people');
    expect(state.crewPeopleFacet).toBe('available');

    const next = buildExploreBrowseSearchParams({
      base: params,
      isDesktop: true,
      state: {
        ...state,
        geoPath: state.geoPath,
        tripMapTopics: state.tripMapTopics,
        placeMapTopics: state.placeMapTopics,
        priceFilter: state.priceFilter,
        hasTrip: state.hasTrip,
        facilityKinds: state.facilityKinds,
      },
      patch: {},
    });
    expect(next.get('view')).toBeNull();
    expect(next.get('list')).toBe('1');
    expect(next.get('peopleFacet')).toBe('available');
    const roundTrip = parseExploreBrowseStateFromSearchParams(next, true);
    expect(roundTrip.crewPeopleFacet).toBe('available');
  });

  it('round-trips geo drill on explore map URL', () => {
    const params = new URLSearchParams('geo=dubai%2Fhatta');
    const parsed = parseExploreBrowseStateFromSearchParams(params, false);
    expect(parsed.geoPath).toEqual(['dubai', 'hatta']);
    const next = buildExploreBrowseSearchParams({
      base: params,
      isDesktop: false,
      state: { ...parsed, listOpen: false, browseOpen: false },
      patch: {},
    });
    expect(next.get('geo')).toBe('dubai/hatta');
  });

  it('derives map panel from list browse bucket on desktop', () => {
    const places = parseExploreBrowseStateFromSearchParams(
      new URLSearchParams('list=1&listCat=venues'),
      true
    );
    expect(places.panel).toBe('venues');
    expect(places.desktopBrowseTab).toBe('venues');

    const events = parseExploreBrowseStateFromSearchParams(
      new URLSearchParams('list=1&panel=venues'),
      true
    );
    expect(events.panel).toBe('activities');
    expect(events.desktopBrowseTab).toBe('activities');
  });

  it('writes parent panel + filter only (no places/activity duplicates)', () => {
    const params = new URLSearchParams('panel=venues&filter=camping&places=camping&activity=camping');
    const state = parseExploreBrowseStateFromSearchParams(params, true);
    expect(state.panel).toBe('venues');
    expect(state.mapFilter).toBe('camping');
    expect(state.venueFilter).toBe('camping');

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
        othersSubtype: state.othersSubtype,
        outingTopic: state.outingTopic,
        pinKind: state.pinKind,
        topicPills: state.topicPills,
        listMode: state.listMode,
        crewsBrowseOpen: state.crewsBrowseOpen,
        searchScope: state.searchScope,
        crewBrowseLane: state.crewBrowseLane,
        crewPeopleFacet: state.crewPeopleFacet,
        geoPath: state.geoPath,
        tripMapTopics: state.tripMapTopics,
        placeMapTopics: state.placeMapTopics,
        priceFilter: state.priceFilter,
        hasTrip: state.hasTrip,
        facilityKinds: state.facilityKinds,
      },
      patch: {},
    });
    expect(next.get('panel')).toBe('venues');
    expect(next.get('filter')).toBe('camping');
    expect(next.get('places')).toBeNull();
    expect(next.get('activity')).toBeNull();
  });

  it('hydrates camping places from filter alone', () => {
    const state = parseExploreBrowseStateFromSearchParams(
      new URLSearchParams('panel=venues&filter=camping'),
      true
    );
    expect(state.mapFilter).toBe('camping');
    expect(state.venueFilter).toBe('camping');
    expect(state.activityFilter).toBe('camping');
  });

  it('clamps invalid map filter for activities desktop tab', () => {
    const params = new URLSearchParams('filter=shops&panel=activities');
    const state = parseExploreBrowseStateFromSearchParams(params, true);
    expect(state.mapFilter).toBe('all');
  });

  it('preserves compose overlay when browse filters sync', () => {
    const params = new URLSearchParams('compose=activity:hiking&filter=hiking');
    const state = parseExploreBrowseStateFromSearchParams(params, true);
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
        othersSubtype: state.othersSubtype,
        outingTopic: state.outingTopic,
        pinKind: state.pinKind,
        topicPills: state.topicPills,
        listMode: state.listMode,
        crewsBrowseOpen: state.crewsBrowseOpen,
        searchScope: state.searchScope,
        crewBrowseLane: state.crewBrowseLane,
        crewPeopleFacet: state.crewPeopleFacet,
        geoPath: state.geoPath,
        tripMapTopics: state.tripMapTopics,
        placeMapTopics: state.placeMapTopics,
        priceFilter: state.priceFilter,
        hasTrip: state.hasTrip,
        facilityKinds: state.facilityKinds,
      },
      patch: { list: true },
    });
    expect(next.get('compose')).toBe('activity:hiking');
  });

  it('strips leftover followedKind from explore URL on sync', () => {
    const params = new URLSearchParams('view=people&followedKind=places');
    const state = parseExploreBrowseStateFromSearchParams(params, true);
    expect(state).not.toHaveProperty('followedSegment');
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
        othersSubtype: state.othersSubtype,
        outingTopic: state.outingTopic,
        pinKind: state.pinKind,
        topicPills: state.topicPills,
        listMode: state.listMode,
        crewsBrowseOpen: state.crewsBrowseOpen,
        searchScope: state.searchScope,
        crewBrowseLane: state.crewBrowseLane,
        crewPeopleFacet: state.crewPeopleFacet,
        geoPath: state.geoPath,
        tripMapTopics: state.tripMapTopics,
        placeMapTopics: state.placeMapTopics,
        priceFilter: state.priceFilter,
        hasTrip: state.hasTrip,
        facilityKinds: state.facilityKinds,
      },
      patch: {},
    });
    expect(next.get('followedKind')).toBeNull();
  });
});
