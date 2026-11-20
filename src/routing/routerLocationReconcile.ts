/** Normalize URL parts for router ↔ browser comparison. */
export const snapshotLocationUrl = (
  pathname: string,
  search: string,
  hash: string
): string => `${pathname}${search}${hash}`;

export const readBrowserLocationSnapshot = (): string => {
  if (typeof window === 'undefined') return '';
  return snapshotLocationUrl(
    window.location.pathname,
    window.location.search,
    window.location.hash
  );
};

export const HISTORY_CHANGE_EVENT = 'uaetrail:history-change';

let historyNotifyInstalled = false;
let lastNotifiedSnapshot = '';

/** Notify when the address bar URL string actually changes. */
export const installHistoryChangeNotify = (): void => {
  if (historyNotifyInstalled || typeof window === 'undefined') return;
  historyNotifyInstalled = true;

  const notify = () => {
    queueMicrotask(() => {
      const snapshot = readBrowserLocationSnapshot();
      if (snapshot === lastNotifiedSnapshot) return;
      lastNotifiedSnapshot = snapshot;
      window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
    });
  };

  lastNotifiedSnapshot = readBrowserLocationSnapshot();

  const { pushState, replaceState } = history;
  history.pushState = function pushStatePatched(...args) {
    pushState.apply(this, args);
    notify();
  };
  history.replaceState = function replaceStatePatched(...args) {
    replaceState.apply(this, args);
    notify();
  };
};

export const routerPathFromHistoryState = (state: unknown, fallback: string): string => {
  const key = (state as { key?: unknown } | null)?.key;
  return typeof key === 'string' && key ? key : fallback;
};

export type RouteMatchLocationParts = {
  pathname: string;
  search: string;
  hash: string;
};

/**
 * When pathname diverges between router and the address bar, prefer the deeper path when
 * one is a strict parent of the other so `/explore/hub/home` is not matched as `/explore/hub`.
 */
export const pickRouteMatchLocation = <T extends RouteMatchLocationParts>(
  router: T,
  browser: T
): T => {
  if (router.pathname === browser.pathname) {
    return router;
  }

  const routerPath = router.pathname;
  const browserPath = browser.pathname;

  if (routerPath.startsWith(`${browserPath}/`)) {
    return router;
  }

  if (browserPath.startsWith(`${routerPath}/`)) {
    return browser;
  }

  return browser;
};
