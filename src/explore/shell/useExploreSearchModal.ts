import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';
import { LIST_DISCOVERY_PATH } from '../../config/platform';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { applyProductSearchMutation } from '../../routing/productSearchMutation';

const SEARCH_MODAL_PATHS = new Set([EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH]);

/** Booking search modal — driven by `?search=1` on map and list. */
export const useExploreSearchModal = (
  searchParams: URLSearchParams,
  pathname: string,
  navigate: NavigateFunction,
  setSearchParams: SetURLSearchParams
) => {
  const wireOpen = searchParams.get('search') === '1' && SEARCH_MODAL_PATHS.has(pathname);
  const [exploreSearchModalOpen, setExploreSearchModalOpen] = useState(() => wireOpen);

  useEffect(() => {
  if (wireOpen) setExploreSearchModalOpen(true);
  else if (!searchParams.get('search')) setExploreSearchModalOpen(false);
  }, [wireOpen, searchParams]);

  const closeExploreSearchModal = useCallback(() => {
    setExploreSearchModalOpen(false);
    if (searchParams.get('search') !== '1') return;
    if (!SEARCH_MODAL_PATHS.has(pathname)) return;
    applyProductSearchMutation({ pathname, navigate, setSearchParams }, (params) => {
      params.delete('search');
    });
  }, [pathname, navigate, searchParams, setSearchParams]);

  return { exploreSearchModalOpen, setExploreSearchModalOpen, closeExploreSearchModal };
};