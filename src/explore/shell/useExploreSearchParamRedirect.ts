import { useEffect } from 'react';
import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';
import { LIST_DISCOVERY_PATH } from '../../config/platform';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import {
  EXPLORE_SEARCH_COMPOSE_PARAM,
  EXPLORE_SEARCH_RESULTS_PATH,
} from '../search/exploreSearchRouting';

type SearchModalPath = typeof EXPLORE_MAP_PATH | typeof LIST_DISCOVERY_PATH;

const isSearchModalPath = (path: string): path is SearchModalPath =>
  path === EXPLORE_MAP_PATH || path === LIST_DISCOVERY_PATH;

/** Inbound `?search=1` on map/list → full-page search home (`searchHome=1`). */
export const useExploreSearchParamRedirect = (
  searchParams: URLSearchParams,
  pathname: string,
  navigate: NavigateFunction,
  _setSearchParams: SetURLSearchParams
) => {
  const inboundSearchOpen = searchParams.get('search') === '1' && isSearchModalPath(pathname);

  const inboundRetiredComposeSearchHome =
    pathname === EXPLORE_SEARCH_RESULTS_PATH &&
    searchParams.get('compose') === '1' &&
    searchParams.get(EXPLORE_SEARCH_COMPOSE_PARAM) !== '1';

  useEffect(() => {
    if (!inboundSearchOpen && !inboundRetiredComposeSearchHome) return;
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('compose');
    next.set(EXPLORE_SEARCH_COMPOSE_PARAM, '1');
    const qs = next.toString();
    navigate(qs ? `${EXPLORE_SEARCH_RESULTS_PATH}?${qs}` : `${EXPLORE_SEARCH_RESULTS_PATH}?${EXPLORE_SEARCH_COMPOSE_PARAM}=1`, {
      replace: true,
    });
  }, [inboundSearchOpen, inboundRetiredComposeSearchHome, navigate, searchParams]);
};