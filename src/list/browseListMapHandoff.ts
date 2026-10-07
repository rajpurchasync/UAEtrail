import { parseExplorePinKindFilter, serializeExplorePinKindFilter } from '../explore/explorePinKindFilter';
import type { ExplorePinKindFilter } from '../explore/explorePinKindFilter';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { LIST_CAT_PARAM, serializeBrowseListSearchParams } from './browseListUrlState';

/** Explore `pinKind` when opening the map from list browse state. */
export const resolveListBrowseExplorePinKind = (
  state: BrowseListFilterState,
  listCat: BrowseMainCategoryKey | null
): ExplorePinKindFilter | null => {
  if (listCat === 'people') return null;
  if (listCat === 'venues') return 'places';
  if (listCat === 'shops') return 'shops';
  if (listCat === 'trips') return state.tripLookingOnly ? 'looking' : 'trips';

  if (state.tripLookingOnly) return 'looking';

  const cats = new Set(state.categories);
  const hasTrips = cats.has('trips');
  const hasVenues = cats.has('venues');
  const hasShops = cats.has('shops');

  if (hasVenues && !hasTrips && !hasShops) return 'places';
  if (hasShops && !hasTrips && !hasVenues) return 'shops';
  if (hasTrips && !hasVenues && !hasShops) return 'trips';

  return null;
};

/** Full-screen list `listCat` when handoff from explore map query. */
export const inferListCatFromExploreHandoff = (
  state: BrowseListFilterState,
  searchParams: Pick<URLSearchParams, 'get'>
): BrowseMainCategoryKey | null => {
  if (searchParams.get('searchScope') === 'people') return 'people';

  const pinKind = parseExplorePinKindFilter(searchParams.get('pinKind'));
  if (pinKind === 'places') return 'venues';
  if (pinKind === 'shops') return 'shops';
  if (pinKind === 'trips' || pinKind === 'looking') return 'trips';

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

  const pinKind = resolveListBrowseExplorePinKind(state, options?.listCat ?? null);
  const serializedPinKind = pinKind ? serializeExplorePinKindFilter(pinKind) : null;
  if (serializedPinKind) params.set('pinKind', serializedPinKind);
  else params.delete('pinKind');

  return params;
};
