import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  clearExploreComposeParams,
  isAddWizard,
  isComposeMenu,
  isFindWizard,
  isOrganizeWizard,
  migrateLegacyExploreComposeParams,
  parseExploreCompose,
  setExploreComposeParam,
  type ExploreCompose,
} from '../compose';
import { resolveComposeRouteChange } from '../exploreComposeRouteGuard';

type UseExploreComposeRouteArgs = {
  user: { id: string } | null | undefined;
  navigate: NavigateFunction;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
  onOpenComposeMenu: () => void;
  canPublish: boolean;
  signupProfileComplete: boolean;
  hostGateLoading: boolean;
};

export const useExploreComposeRoute = ({
  user,
  navigate,
  searchParams,
  setSearchParams,
  onOpenComposeMenu,
  canPublish,
  signupProfileComplete,
  hostGateLoading,
}: UseExploreComposeRouteArgs) => {
  const exploreCompose = useMemo(() => parseExploreCompose(searchParams), [searchParams]);
  const [guestComposeSignInOpen, setGuestComposeSignInOpen] = useState(false);

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
    setGuestComposeSignInOpen(false);
  }, [setComposeRoute]);

  useEffect(() => {
    const migrated = migrateLegacyExploreComposeParams(searchParams);
    if (!migrated) return;
    setSearchParams(migrated, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('compose') !== '1') return;
    onOpenComposeMenu();
    setComposeRoute({ surface: 'menu' });
  }, [searchParams, setComposeRoute, onOpenComposeMenu]);

  const handleCreateTap = useCallback(() => {
    if (hostGateLoading && user) return;
    setComposeRoute({ surface: 'menu' });
  }, [user, hostGateLoading, setComposeRoute]);

  const handleComposeRouteChange = useCallback(
    (route: ExploreCompose | null) => {
      const decision = resolveComposeRouteChange(route, {
        user,
        hostGateLoading,
        canPublish,
        signupProfileComplete,
      });
      if (decision.type === 'sign-in') {
        if (!user) {
          setGuestComposeSignInOpen(true);
          return;
        }
        navigate(decision.href);
        return;
      }
      if (decision.type === 'complete-profile') {
        navigate(decision.href);
        return;
      }
      if (decision.type === 'blocked') return;
      setComposeRoute(decision.route);
    },
    [user, hostGateLoading, canPublish, signupProfileComplete, navigate, setComposeRoute]
  );

  const closeGuestComposeSignIn = useCallback(() => {
    setGuestComposeSignInOpen(false);
  }, []);

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
    guestComposeSignInOpen,
    closeGuestComposeSignIn,
  };
};
