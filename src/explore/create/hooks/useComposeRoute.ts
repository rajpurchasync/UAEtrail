import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';
import {
  clearExploreComposeParams,
  formatComposeQuery,
  isAddWizard,
  isComposeMenu,
  isSeekFixedWizard,
  isHostWizard,
  isSeekFlexibleWizard,
  parseExploreCompose,
  setExploreComposeParam,
  type ExploreCompose,
} from '../../compose';
import {
  buildComposeAuthReturnPath,
  captureGuestComposeResume,
  clearGuestComposeResumeSession,
  guestComposeResumeRoute,
  readGuestComposeResumeSession,
  writeGuestComposeResumeSession,
} from '../guestComposeResume';
import { clearComposeWizardSessionForRoute } from '../../ui/composeWizardSession';
import { PLAN_WITH_QUERY_KEY } from '../../routing';
import { composeRouteRequiresAuth, resolveComposeRouteChange } from '../composeRouteGuard';

export type UseComposeRouteArgs = {
  user: { id: string } | null | undefined;
  navigate: NavigateFunction;
  pathname: string;
  search: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  onOpenComposeMenu: () => void;
  canPublish: boolean;
  profileComplete: boolean;
  hostGateLoading: boolean;
};

/** `?compose=` URL state — shared by `/explore` and `/list` (not map-only). */
export const useComposeRoute = ({
  user,
  navigate,
  pathname,
  search,
  searchParams,
  setSearchParams,
  onOpenComposeMenu,
  canPublish,
  profileComplete,
  hostGateLoading,
}: UseComposeRouteArgs) => {
  const composeRoute = useMemo(() => parseExploreCompose(searchParams), [searchParams]);
  const [guestComposeSignInOpen, setGuestComposeSignInOpen] = useState(false);
  const [guestComposePendingRoute, setGuestComposePendingRoute] = useState<ExploreCompose | null>(
    null
  );
  const [wizardEnteredFromMenu, setWizardEnteredFromMenu] = useState(false);
  const prevComposeRouteRef = useRef<ExploreCompose | null>(null);

  const composeMenuOpen = isComposeMenu(composeRoute);
  const hostComposeRoute = isHostWizard(composeRoute) ? composeRoute : null;
  const seekFixedRoute = isSeekFixedWizard(composeRoute) ? composeRoute : null;
  const addRoute = isAddWizard(composeRoute) ? composeRoute : null;
  const seekFlexibleOpen = isSeekFlexibleWizard(composeRoute);

  const setComposeRoute = useCallback(
    (route: ExploreCompose | null) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (!route) {
            clearExploreComposeParams(params);
          } else {
            setExploreComposeParam(params, route);
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const closeCompose = useCallback(() => {
    setSearchParams(
      (prev) => {
        clearComposeWizardSessionForRoute(parseExploreCompose(prev));
        const params = new URLSearchParams(prev);
        clearExploreComposeParams(params);
        params.delete(PLAN_WITH_QUERY_KEY);
        return params;
      },
      { replace: true }
    );
    setWizardEnteredFromMenu(false);
    setGuestComposeSignInOpen(false);
    setGuestComposePendingRoute(null);
    clearGuestComposeResumeSession();
  }, [setSearchParams]);

  const blockGuestComposeWizard = useCallback(
    (route: ExploreCompose, fromMenu: boolean) => {
      writeGuestComposeResumeSession(captureGuestComposeResume(route, fromMenu));
      setGuestComposePendingRoute(route);
      setGuestComposeSignInOpen(true);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          clearExploreComposeParams(params);
          return params;
        },
        { replace: true }
      );
      if (!fromMenu) setWizardEnteredFromMenu(false);
    },
    [setSearchParams]
  );

  useEffect(() => {
    const prev = prevComposeRouteRef.current;
    const next = composeRoute;

    const openedWizardFromMenu =
      Boolean(next && prev && isComposeMenu(prev)) &&
      (isHostWizard(next) || isSeekFixedWizard(next) || isAddWizard(next));

    if (openedWizardFromMenu && next) {
      clearComposeWizardSessionForRoute(next);
      setWizardEnteredFromMenu(true);
    } else if (!next || isComposeMenu(next)) {
      setWizardEnteredFromMenu(false);
    }

    prevComposeRouteRef.current = next;
  }, [composeRoute]);

  useEffect(() => {
    if (searchParams.get('compose') !== '1') return;
    onOpenComposeMenu();
    setComposeRoute({ surface: 'menu' });
  }, [searchParams, setComposeRoute, onOpenComposeMenu]);

  useEffect(() => {
    if (user) return;
    if (!composeRoute || !composeRouteRequiresAuth(composeRoute)) return;
    blockGuestComposeWizard(composeRoute, isComposeMenu(composeRoute));
  }, [user, composeRoute, blockGuestComposeWizard]);

  useEffect(() => {
    if (!user) return;
    const resume = readGuestComposeResumeSession();
    if (!resume) return;

    const route = guestComposeResumeRoute(resume);
    if (!route) {
      clearGuestComposeResumeSession();
      return;
    }

    const currentWire = composeRoute ? formatComposeQuery(composeRoute) : null;
    if (currentWire !== resume.composeWire) {
      setComposeRoute(route);
    }
    if (resume.fromMenu) setWizardEnteredFromMenu(true);
    clearGuestComposeResumeSession();
    setGuestComposePendingRoute(null);
    setGuestComposeSignInOpen(false);
  }, [user, composeRoute, setComposeRoute]);

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
          if (route && composeRouteRequiresAuth(route)) {
            blockGuestComposeWizard(
              route,
              isComposeMenu(route) || isComposeMenu(composeRoute)
            );
          }
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
    [
      user,
      hostGateLoading,
      canPublish,
      profileComplete,
      navigate,
      setComposeRoute,
      composeRoute,
      blockGuestComposeWizard,
    ]
  );

  const guestComposeSignInReturnPath = useMemo(() => {
    if (!guestComposePendingRoute) return null;
    return buildComposeAuthReturnPath(pathname, search, guestComposePendingRoute);
  }, [guestComposePendingRoute, pathname, search]);

  const closeGuestComposeSignIn = useCallback(() => {
    setGuestComposeSignInOpen(false);
    setGuestComposePendingRoute(null);
    clearGuestComposeResumeSession();
    setSearchParams(
      (prev) => {
        const pending = parseExploreCompose(prev);
        if (!pending || !composeRouteRequiresAuth(pending)) {
          return prev;
        }
        const params = new URLSearchParams(prev);
        clearExploreComposeParams(params);
        return params;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return {
    composeRoute,
    composeMenuOpen,
    hostComposeRoute,
    seekFixedRoute,
    addRoute,
    seekFlexibleOpen,
    setComposeRoute,
    closeCompose,
    handleCreateTap,
    handleComposeRouteChange,
    guestComposeSignInOpen,
    guestComposeSignInReturnPath,
    closeGuestComposeSignIn,
    wizardEnteredFromMenu,
  };
};
