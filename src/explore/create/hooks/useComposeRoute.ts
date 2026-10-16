import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  clearExploreComposeParams,
  isAddWizard,
  isComposeMenu,
  isFindWizard,
  isOrganizeWizard,
  isSeekFlexibleWizard,
  migrateLegacyExploreComposeParams,
  parseExploreCompose,
  setExploreComposeParam,
  type ExploreCompose,
} from '../../compose';
import { resolveComposeRouteChange } from '../composeRouteGuard';

export type UseComposeRouteArgs = {
  user: { id: string } | null | undefined;
  navigate: NavigateFunction;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
  onOpenComposeMenu: () => void;
  canPublish: boolean;
  profileComplete: boolean;
  hostGateLoading: boolean;
};

/** `?compose=` URL state — shared by `/explore` and `/list` (not map-only). */
export const useComposeRoute = ({
  user,
  navigate,
  searchParams,
  setSearchParams,
  onOpenComposeMenu,
  canPublish,
  profileComplete,
  hostGateLoading,
}: UseComposeRouteArgs) => {
  const composeRoute = useMemo(() => parseExploreCompose(searchParams), [searchParams]);
  const [guestComposeSignInOpen, setGuestComposeSignInOpen] = useState(false);

  const composeMenuOpen = isComposeMenu(composeRoute);
  const planHostingRoute = isOrganizeWizard(composeRoute) ? composeRoute : null;
  const planSeekingRoute = isFindWizard(composeRoute) ? composeRoute : null;
  const contributeRoute = isAddWizard(composeRoute) ? composeRoute : null;
  const seekFlexibleOpen = isSeekFlexibleWizard(composeRoute);

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
        profileComplete,
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
    [user, hostGateLoading, canPublish, profileComplete, navigate, setComposeRoute]
  );

  const closeGuestComposeSignIn = useCallback(() => {
    setGuestComposeSignInOpen(false);
  }, []);

  return {
    composeRoute,
    composeMenuOpen,
    planHostingRoute,
    planSeekingRoute,
    contributeRoute,
    seekFlexibleOpen,
    setComposeRoute,
    closeCompose,
    handleCreateTap,
    handleComposeRouteChange,
    guestComposeSignInOpen,
    closeGuestComposeSignIn,
    /** @deprecated Use {@link composeRoute}. */
    exploreCompose: composeRoute,
    /** @deprecated Use {@link planHostingRoute}. */
    organizeRoute: planHostingRoute,
    /** @deprecated Use {@link planHostingRoute}. */
    hostComposeRoute: planHostingRoute,
    /** @deprecated Use {@link planSeekingRoute}. */
    findRoute: planSeekingRoute,
    /** @deprecated Use {@link contributeRoute}. */
    addRoute: contributeRoute,
  };
};

/** @deprecated Use {@link useComposeRoute}. */
export const useExploreComposeRoute = useComposeRoute;
