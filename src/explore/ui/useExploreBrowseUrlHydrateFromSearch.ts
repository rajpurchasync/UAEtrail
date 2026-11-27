import { useCallback, useEffect } from 'react';
import { clampGuestCrewsBrowse, parseExploreBrowseStateFromSearchParams } from '../exploreBrowseUrlHydrate';
import { applyExploreBrowseHydratedState, type ExploreBrowseUrlSetterBundle } from './exploreBrowseUrlApplyHydrated';

export const useExploreBrowseUrlHydrateFromSearch = (
  searchParams: URLSearchParams,
  isDesktop: boolean,
  isSignedIn: boolean,
  setters: ExploreBrowseUrlSetterBundle,
  pathname: string
): void => {
  const applyHydratedState = useCallback(
    (state: Parameters<typeof applyExploreBrowseHydratedState>[1]) =>
      applyExploreBrowseHydratedState(setters, state, isDesktop),
    [isDesktop, setters]
  );
  const browseSearchKey = searchParams.toString();
  useEffect(() => {
    applyHydratedState(
      clampGuestCrewsBrowse(
        parseExploreBrowseStateFromSearchParams(searchParams, isDesktop, { pathname }),
        isSignedIn
      )
    );
  }, [browseSearchKey, isDesktop, isSignedIn, pathname, applyHydratedState, searchParams]);
};