import { parseExplorePinKindFilter, serializeExplorePinKindFilter } from '../explore/explorePinKindFilter';
import type { ExplorePinKindFilter } from '../explore/explorePinKindFilter';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { BUDDIES_SEGMENT_URL_PARAM, serializeBuddiesDiscoverySegment } from './buddiesDiscoverySegment';
import {
  LIST_CAT_PARAM,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

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
  if (listCat === 'activities') return state.tripLookingOnly ? 'looking' : 'activities';

  if (state.tripLookingOnly) return 'looking';

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
  if (pinKind === 'activities' || pinKind === 'looking') return 'activities';

  const cats = state.categories;
  if (cats.length === 1) return cats[0];
  return null;
};

/** Shared browse params for `/explore` — drops list-only keys, adds `pinKind` when scoped. */
export const serializeBrowseListToExploreSearchParams = (
  state: BrowseListFilterState,
  regions: string[],
  options?: { listCat?: BrowseMainCategoryKey | null }
): URLSearchParams => {
  const params = serializeBrowseListSearchParams(state, regions);
  params.delete(LIST_CAT_PARAM);
  params.delete('price');

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
    const serializedBuddies = serializeBuddiesDiscoverySegment(state.buddiesSegment);
    if (serializedBuddies) params.set(BUDDIES_SEGMENT_URL_PARAM, serializedBuddies);
    else params.delete(BUDDIES_SEGMENT_URL_PARAM);
    params.set('view', 'people');
    params.set('list', '1');
    params.delete('date');
    params.delete('when');
  } else if (listCat) {
    params.set(LIST_CAT_PARAM, listCat);
  }

  return params;
};
