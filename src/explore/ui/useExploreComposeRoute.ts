import { useCallback, useEffect, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { signInPathForReturn } from '../../utils/authReturnContext';
import {
  clearExploreComposeParams,
  isAddWizard,
  isComposeMenu,
  isFindWizard,
  isOrganizeWizard,
  parseExploreCompose,
  setExploreComposeParam,
  type ExploreCompose,
} from '../compose';
import { explorePath } from '../routing';

type UseExploreComposeRouteArgs = {
  user: { id: string } | null | undefined;
  navigate: NavigateFunction;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
  onOpenComposeMenu: () => void;
  canPublish: boolean;
  hostGateLoading: boolean;
};

export const useExploreComposeRoute = ({
  user,
  navigate,
  searchParams,
  setSearchParams,
  onOpenComposeMenu,
  canPublish,
  hostGateLoading,
}: UseExploreComposeRouteArgs) => {
  const exploreCompose = useMemo(() => parseExploreCompose(searchParams), [searchParams]);

  const composeMenuOpen = isComposeMenu(exploreCompose);
  const organizeRoute = isOrganizeWizard(exploreCompose) ? exploreCompose : null;
  const findRoute = isFindWizard(exploreCompose) ? exploreCompose : null;
  const addRoute = isAddWizard(exploreCompose) ? exploreCompose : null;

  const setComposeRoute = useCallback(
    (route: ExploreCompose | null) => {
      const params = new URLSearchParams(searchParams);
      if (!route) {
        clearExploreComposeParams(params);
      } else {
        setExploreComposeParam(params, route);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const closeCompose = useCallback(() => {
    setComposeRoute(null);
  }, [setComposeRoute]);

  useEffect(() => {
    const hasLegacy =
      searchParams.has('request') ||
      searchParams.has('contribute') ||
      searchParams.get('addLocation') === '1';
    if (!hasLegacy) return;
    const parsed = parseExploreCompose(searchParams);
    if (!parsed) return;
    const params = new URLSearchParams(searchParams);
    setExploreComposeParam(params, parsed);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('compose') !== '1') return;
    if (!user) {
      navigate(signInPathForReturn(explorePath({ compose: 'menu' })));
      return;
    }
    onOpenComposeMenu();
    setComposeRoute({ surface: 'menu' });
  }, [searchParams, user, navigate, setComposeRoute, onOpenComposeMenu]);

  const handleCreateTap = useCallback(() => {
    if (!user) {
      navigate(signInPathForReturn(explorePath({ compose: 'menu' })));
      return;
    }
    if (hostGateLoading) return;
    setComposeRoute({ surface: 'menu' });
  }, [user, hostGateLoading, navigate, setComposeRoute]);

  const handleComposeRouteChange = useCallback(
    (route: ExploreCompose | null) => {
      if (route && isOrganizeWizard(route)) {
        if (!user) {
          navigate(signInPathForReturn(explorePath({ compose: route })));
          return;
        }
        if (hostGateLoading) return;
        if (!canPublish) {
          navigate('/become-host');
          return;
        }
      }
      if (route && (isFindWizard(route) || isAddWizard(route)) && !user) {
        navigate(signInPathForReturn(explorePath({ compose: route })));
        return;
      }
      setComposeRoute(route);
    },
    [user, hostGateLoading, canPublish, navigate, setComposeRoute]
  );

  return {
    exploreCompose,
    composeMenuOpen,
    organizeRoute,
    findRoute,
    addRoute,
    setComposeRoute,
    closeCompose,
    handleCreateTap,
    handleComposeRouteChange,
  };
};
