import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HISTORY_CHANGE_EVENT,
  readBrowserLocationSnapshot,
  snapshotLocationUrl,
} from './routerLocationReconcile';

/**
 * Recover when `window.location` and React Router diverge — the address bar can show
 * `/plan` while the explore map route is still mounted (tab taps feel dead).
 */
export const RouterLocationReconcile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  const recoveriesRef = useRef(0);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    const routerSnapshot = () =>
      snapshotLocationUrl(locationRef.current.pathname, locationRef.current.search, locationRef.current.hash);

    const reconcile = () => {
      const target = readBrowserLocationSnapshot();
      const router = routerSnapshot();
      if (target === router) {
        recoveriesRef.current = 0;
        return;
      }

      recoveriesRef.current += 1;
      navigate(
        {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        },
        { replace: recoveriesRef.current > 1 }
      );

      if (recoveriesRef.current >= 3) {
        window.location.assign(target);
      }
    };

    window.addEventListener(HISTORY_CHANGE_EVENT, reconcile);
    window.addEventListener('popstate', reconcile);
    return () => {
      window.removeEventListener(HISTORY_CHANGE_EVENT, reconcile);
      window.removeEventListener('popstate', reconcile);
    };
  }, [navigate]);

  return null;
};
