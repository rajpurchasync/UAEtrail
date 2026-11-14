import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';
import { applyProductSearchMutation } from '../../routing/productSearchMutation';

/** Map search overlay driven by `?search=1` on explore. */
export const useExploreSearchModal = (
  searchParams: URLSearchParams,
  pathname: string,
  navigate: NavigateFunction,
  setSearchParams: SetURLSearchParams
) => {
  const [exploreSearchModalOpen, setExploreSearchModalOpen] = useState(
    () => searchParams.get('search') === '1'
  );
  const exploreSearchOpenWire = searchParams.get('search') === '1';

  useEffect(() => {
    if (exploreSearchOpenWire) setExploreSearchModalOpen(true);
  }, [exploreSearchOpenWire]);

  const closeExploreSearchModal = useCallback(() => {
    setExploreSearchModalOpen(false);
    if (searchParams.get('search') !== '1') return;
    applyProductSearchMutation({ pathname, navigate, setSearchParams }, (params) => {
      params.delete('search');
    });
  }, [pathname, navigate, searchParams, setSearchParams]);

  return { exploreSearchModalOpen, setExploreSearchModalOpen, closeExploreSearchModal };
};