/** Keep `window.location` in sync when React Router search updates lag the address bar. */
export const alignBrowserSearchWithPath = (pathname: string, params: URLSearchParams): void => {
  if (typeof window === 'undefined') return;
  const qs = params.toString();
  const nextPathSearch = `${pathname}${qs ? `?${qs}` : ''}`;
  const currentPathSearch = `${window.location.pathname}${window.location.search}`;
  if (currentPathSearch === nextPathSearch) return;
  const url = `${nextPathSearch}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', url);
};
