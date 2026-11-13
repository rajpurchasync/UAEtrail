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
