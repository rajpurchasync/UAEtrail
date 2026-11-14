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
  readBrowserLocationSnapshot,
  routerPathFromHistoryState,
  snapshotLocationUrl,
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
    const routerSnapshot = snapshotLocationUrl(
      routerLocation.pathname,
      routerLocation.search,
      routerLocation.hash
    );
    const browser = readBrowserLocation();
    const pathnameDesynced = browser.pathname !== routerLocation.pathname;

    if (pathnameDesynced && browserSnapshot !== routerSnapshot) {
      return browser;
    }
    return routerLocation;
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
