import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { readBrowserLocationSnapshot, snapshotLocationUrl } from './routerLocationReconcile';

/** Dev-only: log when the address bar and React Router diverge (pathname or full URL). */
export const RouterDesyncDebug = () => {
  const location = useLocation();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const router = snapshotLocationUrl(location.pathname, location.search, location.hash);
    const bar = readBrowserLocationSnapshot();
    if (router !== bar) {
      console.warn('[uaetrail:router-desync]', { router, bar });
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
};
