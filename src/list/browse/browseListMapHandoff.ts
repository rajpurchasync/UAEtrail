import {
  parseExplorePanel,
  parseExplorePinKindFilter,
  serializeExplorePinKindFilter,
  type ExplorePinKindFilter,
} from '../../discovery/discoveryPortExploreRuntime';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  CREW_PEOPLE_SURFACE_URL_PARAM,
  serializeCrewPeopleSurface,
} from '@/crew-discovery/crewPeopleSurface';
import {
  PEOPLE_FACET_URL_PARAM,
  PEOPLE_LIST_TAB_URL_PARAM,
  serializePeopleListBrowseState,
} from './peopleListBrowseUrl';
import { LIST_CAT_PARAM, serializeBrowseListSearchParams } from '../../discovery/discoverySession';
import { stripRetiredPeopleListTabParams } from '../../routing/productUrlInbound';

/** Explore `pinKind` when opening the map from list browse state. */
export const resolveListBrowseExplorePinKind = (
  state: BrowseListFilterState,
  listCat: BrowseMainCategoryKey | null
): ExplorePinKindFilter | null => {
  if (listCat === 'people') return null;
  if (listCat === 'venues') {
    if (state.placeTopics.length === 1 && state.placeTopics[0] === 'shop') return 'shops';
    return 'places';
  }
  if (listCat === 'activities') return 'activities';

  if (state.tripAvailabilityOnly) return 'activities';

  const cats = new Set(state.categories);
  const hasTrips = cats.has('activities');
  const hasVenues = cats.has('venues');

  if (hasVenues && !hasTrips) {
    if (state.placeTopics.length === 1 && state.placeTopics[0] === 'shop') return 'shops';
    return 'places';
  }
  if (hasTrips && !hasVenues) return 'activities';

  return null;
};

/** Full-screen list `listCat` when handoff from explore map query. */
export const inferListCatFromExploreHandoff = (
  state: BrowseListFilterState,
  searchParams: Pick<URLSearchParams, 'get'>
): BrowseMainCategoryKey | null => {
  if (searchParams.get('searchScope') === 'people') return 'people';
  const view = searchParams.get('view');
  if (view === 'people' || view === 'social' || view === 'going') return 'people';

  const pinKind = parseExplorePinKindFilter(searchParams.get('pinKind'));
  if (pinKind === 'places') return 'venues';
  if (pinKind === 'shops') return 'venues';
  if (pinKind === 'activities') return 'activities';

  const panel = parseExplorePanel(searchParams.get('panel'));
  if (panel === 'venues' || panel === 'shops') return 'venues';
  if (panel === 'activities') return 'activities';

  const cats = state.categories;
  if (cats.length === 1) return cats[0];
  return null;
};

/** Keep list handoff single-scope for mobile Trips vs Venues tabs. */
export const scopeBrowseListStateForListCat = (
  state: BrowseListFilterState,
  listCat: BrowseMainCategoryKey
): BrowseListFilterState => {
  if (listCat === 'activities') {
    return {
      ...state,
      categories: ['activities'],
      placeTopics: [],
      tripAvailabilityOnly: state.tripAvailabilityOnly,
    };
  }
  if (listCat === 'venues') {
    return {
      ...state,
      categories: ['venues'],
      tripTopics: [],
      tripAvailabilityOnly: false,
      activityDatePreset: 'anyday',
      when: 'any',
      price: 'all',
    };
  }
  return state;
};

export const browseListCatForBucket = (
  bucket: 'events' | 'places'
): 'activities' | 'venues' => (bucket === 'places' ? 'venues' : 'activities');

/** Shared browse params for `/explore` — drops list-only keys, adds `pinKind` when scoped. */
export const serializeBrowseListToExploreSearchParams = (
  state: BrowseListFilterState,
  regions: string[],
  options?: { listCat?: BrowseMainCategoryKey | null; geoPath?: readonly string[] }
): URLSearchParams => {
  const params = serializeBrowseListSearchParams(state, regions, options?.geoPath ?? []);
  params.delete(LIST_CAT_PARAM);

  if (state.when === 'weekend') {
    params.delete('when');
    params.delete('date');
  }

  const listCat = options?.listCat ?? null;
  const pinKind = resolveListBrowseExplorePinKind(state, listCat);
  const serializedPinKind = pinKind ? serializeExplorePinKindFilter(pinKind) : null;
  if (serializedPinKind) params.set('pinKind', serializedPinKind);
  else params.delete('pinKind');

  if (listCat === 'people') {
    params.delete(LIST_CAT_PARAM);
    const { peopleTab, peopleFacet, proKind } = serializePeopleListBrowseState({
      lane: state.crewBrowseLane,
      facet: state.crewPeopleFacet,
      proKind: state.crewProfessionalKind,
    });
    if (peopleTab) params.set(PEOPLE_LIST_TAB_URL_PARAM, peopleTab);
    else params.delete(PEOPLE_LIST_TAB_URL_PARAM);
    if (peopleFacet) params.set(PEOPLE_FACET_URL_PARAM, peopleFacet);
    else params.delete(PEOPLE_FACET_URL_PARAM);
    if (proKind) params.set('proKind', proKind);
    else params.delete('proKind');
    const crewSurface = serializeCrewPeopleSurface(state.crewPeopleSurface);
    if (crewSurface) params.set(CREW_PEOPLE_SURFACE_URL_PARAM, crewSurface);
    else params.delete(CREW_PEOPLE_SURFACE_URL_PARAM);
    params.delete('view');
    params.set('list', '1');
    params.set(LIST_CAT_PARAM, 'people');
    params.delete('date');
    params.delete('when');
  } else if (listCat === 'venues') {
    params.set('panel', 'venues');
    params.set(LIST_CAT_PARAM, listCat);
  } else if (listCat === 'activities') {
    params.set('panel', 'activities');
    params.set(LIST_CAT_PARAM, listCat);
  } else if (listCat) {
    params.set(LIST_CAT_PARAM, listCat);
  }

  stripRetiredPeopleListTabParams(params);
  return params;
};
