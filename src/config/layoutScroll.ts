import { LIST_DISCOVERY_PATH } from './platform';

/** Primary scroll container for product routes (fixed chrome, scrolling main). */
export const APP_SCROLL_ROOT_ID = 'app-scroll-root';

/** Tailwind-friendly class names (defined in `index.css`). */
export const APP_SCROLL_PANE_CLASS = 'app-scroll-pane';
export const APP_SCROLL_PANE_DELEGATED_CLASS = 'app-scroll-pane-delegated';
export const APP_SCROLL_BODY_CLASS = 'app-scroll-body';
export const APP_PAGE_MIN_H_CLASS = 'app-page-min-h';
export const APP_PAGE_CENTER_CLASS = 'app-page-center';

export const PRODUCT_SHELL_HTML_CLASS = 'product-shell-active';

/** All product scroll panes under `#app-scroll-root` (some routes nest more than one). */
export const getAppScrollContainers = (): HTMLElement[] => {
  const root = document.getElementById(APP_SCROLL_ROOT_ID);
  if (!root) return [];
  const bodies = Array.from(root.querySelectorAll<HTMLElement>(`.${APP_SCROLL_BODY_CLASS}`));
  if (bodies.length > 0) return bodies;
  return [root];
};

/** Primary vertical scroll container for the current product route. */
export const getAppScrollContainer = (): HTMLElement | null => {
  const containers = getAppScrollContainers();
  return containers[0] ?? null;
};

/**
 * Routes where the page owns the scroll region (feed/map) — `#app-scroll-root` does not scroll.
 */
export const isDelegatedProductScrollPath = (pathname: string): boolean =>
  pathname === LIST_DISCOVERY_PATH;

export const resetAppScroll = (): void => {
  const container = getAppScrollContainer();
  if (container) {
    container.scrollTo({ top: 0, left: 0 });
    return;
  }
  window.scrollTo(0, 0);
};

/**
 * In-page tab/filter query changes (`?tab=location`) must not jump the form to the top.
 * Map panning is unaffected — it does not go through this helper.
 */
export const shouldResetAppScrollOnNavigation = (
  previousPathname: string | null,
  nextPathname: string
): boolean => previousPathname !== nextPathname;

export const scrollAppScrollRootTo = (top: number): void => {
  const container = getAppScrollContainer();
  if (container) {
    container.scrollTo({ top, behavior: 'auto' });
    return;
  }
  window.scrollTo({ top, behavior: 'auto' });
};
