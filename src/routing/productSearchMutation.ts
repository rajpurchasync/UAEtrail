import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';

export type ProductSearchMutationContext = {
  pathname: string;
  navigate: NavigateFunction;
  setSearchParams: SetURLSearchParams;
  /** Passed on navigate fallback when history.state must survive filter-only updates. */
  locationState?: unknown;
};

/** Commit query changes through React Router, with a navigate fallback when the bar lags. */
export const applyProductSearchMutation = (
  ctx: ProductSearchMutationContext,
  mutate: (params: URLSearchParams) => void
): void => {
  let nextParams: URLSearchParams | undefined;
  ctx.setSearchParams(
    (prev) => {
      const params = new URLSearchParams(prev);
      mutate(params);
      nextParams = params;
      return params;
    },
    { replace: true }
  );
  if (typeof window === 'undefined' || !nextParams) return;
  if (window.location.pathname !== ctx.pathname) return;
  const intended = nextParams.toString();
  queueMicrotask(() => {
    const bar = new URLSearchParams(window.location.search).toString();
    if (bar !== intended) {
      ctx.navigate(
        { pathname: ctx.pathname, search: intended ? `?${intended}` : '' },
        {
          replace: true,
          ...(ctx.locationState !== undefined ? { state: ctx.locationState } : {}),
        }
      );
    }
  });
};