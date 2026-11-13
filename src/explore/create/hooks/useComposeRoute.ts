import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';
import { clearPlanAddQuery } from '../../../create/planAddQuery';
import {
  clearExploreComposeParams,
  formatComposeQuery,
  isAddWizard,
  isComposeMenu,
  isSeekFixedWizard,
  isHostWizard,
  isSeekFlexibleWizard,
  COMPOSE_QUERY_KEY,
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
import { clearFacilityOnPlaceParams, PLAN_WITH_QUERY_KEY } from '../../routing';
import { composeRouteRequiresAuth, resolveComposeRouteChange } from '../composeRouteGuard';
import {
  HISTORY_CHANGE_EVENT,
  installHistoryChangeNotify,
} from '../../../routing/routerLocationReconcile';

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

/** `?compose=` create-flow session — current surface (`/explore`, `/list`, later `/plan`), not map-only. */
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
  const [locationHistoryTick, setLocationHistoryTick] = useState(0);
  useEffect(() => {
    installHistoryChangeNotify();
    const bump = () => setLocationHistoryTick((n) => n + 1);
    window.addEventListener(HISTORY_CHANGE_EVENT, bump);
    window.addEventListener('popstate', bump);
    return () => {
      window.removeEventListener(HISTORY_CHANGE_EVENT, bump);
      window.removeEventListener('popstate', bump);
    };
  }, []);

  const composeWire = searchParams.get(COMPOSE_QUERY_KEY);
  const composeRoute = useMemo(() => {
    const fromRouter = parseExploreCompose(searchParams);
    if (typeof window === 'undefined' || window.location.pathname !== pathname) {
      return fromRouter;
    }
    const barParams = new URLSearchParams(window.location.search);
    const barWire = barParams.get(COMPOSE_QUERY_KEY);
    if (barWire && barWire !== composeWire) {
      return parseExploreCompose(barParams);
    }
    return fromRouter;
  }, [searchParams, composeWire, pathname, locationHistoryTick]);
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

  const applySearchMutation = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      let nextParams: URLSearchParams | null = null;
      flushSync(() => {
        setSearchParams(
          (prev) => {
            const params = new URLSearchParams(prev);
            mutate(params);
            nextParams = params;
            return params;
          },
          { replace: true }
        );
      });
      if (typeof window === 'undefined' || !nextParams) return;
      if (window.location.pathname !== pathname) return;
      const intended = nextParams.toString();
      const bar = new URLSearchParams(window.location.search).toString();
      if (bar !== intended) {
        flushSync(() => {
          navigate(
            { pathname, search: intended ? `?${intended}` : '' },
            { replace: true }
          );
        });
      }
    },
    [navigate, pathname, setSearchParams]
  );

  const setComposeRoute = useCallback(
    (route: ExploreCompose | null) => {
      applySearchMutation((params) => {
        if (!route) {
          clearExploreComposeParams(params);
          return;
        }
        setExploreComposeParam(params, route);
        clearPlanAddQuery(params);
      });
    },
    [applySearchMutation]
  );

  const closeCompose = useCallback(() => {
    applySearchMutation((params) => {
      clearComposeWizardSessionForRoute(parseExploreCompose(params));
      clearExploreComposeParams(params);
      clearFacilityOnPlaceParams(params);
      params.delete(PLAN_WITH_QUERY_KEY);
    });
    setWizardEnteredFromMenu(false);
    setGuestComposeSignInOpen(false);
    setGuestComposePendingRoute(null);
    clearGuestComposeResumeSession();
  }, [applySearchMutation]);

  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && composeWire) {
      closeCompose();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, composeWire, closeCompose]);

  const blockGuestComposeWizard = useCallback(
    (route: ExploreCompose, fromMenu: boolean) => {
      writeGuestComposeResumeSession(captureGuestComposeResume(route, fromMenu));
      setGuestComposePendingRoute(route);
      setGuestComposeSignInOpen(true);
      applySearchMutation((params) => {
        clearExploreComposeParams(params);
      });
      if (!fromMenu) setWizardEnteredFromMenu(false);
    },
    [applySearchMutation]
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

  const handleComposeRouteChange = useCallback(
    (route: ExploreCompose | null) => {
      const decision = resolveComposeRouteChange(route, {
        user,
        hostGateLoading,
        canPublish,
        profileComplete,
        resumePathname: pathname,
        resumeSearch: search,
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
      pathname,
      search,
    ]
  );

  const handleCreateTap = useCallback(
    (entry: ExploreCompose = { surface: 'menu' }) => {
      if (isComposeMenu(entry)) {
        setComposeRoute(entry);
        return;
      }
      if (hostGateLoading && user) return;
      handleComposeRouteChange(entry);
    },
    [user, hostGateLoading, handleComposeRouteChange, setComposeRoute]
  );

  const guestComposeSignInReturnPath = useMemo(() => {
    if (!guestComposePendingRoute) return null;
    return buildComposeAuthReturnPath(pathname, search, guestComposePendingRoute);
  }, [guestComposePendingRoute, pathname, search]);

  const closeGuestComposeSignIn = useCallback(() => {
    setGuestComposeSignInOpen(false);
    setGuestComposePendingRoute(null);
    clearGuestComposeResumeSession();
    applySearchMutation((params) => {
      const pending = parseExploreCompose(params);
      if (!pending || !composeRouteRequiresAuth(pending)) return;
      clearExploreComposeParams(params);
    });
  }, [applySearchMutation]);

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
