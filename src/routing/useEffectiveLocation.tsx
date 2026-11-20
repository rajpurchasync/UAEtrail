import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type Location, useLocation } from 'react-router-dom';
import {
  HISTORY_CHANGE_EVENT,
  pickRouteMatchLocation,
  readBrowserLocationSnapshot,
  routerPathFromHistoryState,
} from './routerLocationReconcile';

const readBrowserLocation = (): Location => ({
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
  state: window.history.state,
  key: routerPathFromHistoryState(window.history.state, window.location.pathname),
});

/**
 * When the address bar pathname diverges from React Router, match routes/chrome to the bar.
 * Query-only drift stays on the router so FAB `?compose=` and filters are not stripped.
 */
export const useEffectiveLocation = (): Location => {
  const routerLocation = useLocation();
  const [browserSnapshot, setBrowserSnapshot] = useState(() => readBrowserLocationSnapshot());

  useEffect(() => {
    const sync = () => {
      const next = readBrowserLocationSnapshot();
      setBrowserSnapshot((prev) => (prev === next ? prev : next));
    };
    sync();
    window.addEventListener(HISTORY_CHANGE_EVENT, sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener(HISTORY_CHANGE_EVENT, sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  return useMemo(() => {
    const browser = readBrowserLocation();
    if (browser.pathname === routerLocation.pathname) {
      return routerLocation;
    }
    // Reconcile when HISTORY_CHANGE_EVENT updates browserSnapshot (pathname desync).
    return pickRouteMatchLocation(routerLocation, browser);
  }, [browserSnapshot, routerLocation]);
};

const EffectiveLocationContext = createContext<Location | null>(null);

export const EffectiveLocationProvider = ({ children }: { children: ReactNode }) => {
  const location = useEffectiveLocation();
  return (
    <EffectiveLocationContext.Provider value={location}>{children}</EffectiveLocationContext.Provider>
  );
};

/** Layout + route matching — uses reconciled location when router context lags the address bar. */
export const useProductLocation = (): Location => {
  const fromContext = useContext(EffectiveLocationContext);
  const router = useLocation();
  return fromContext ?? router;
};
