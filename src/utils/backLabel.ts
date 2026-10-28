import { resolveMobileTabHeaderTitle } from '../config/mobileTabHeader';
import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../content/productNorthStar';
import { PLAN_PATH } from '../config/routingCatalog';
import type { BackTarget } from './backStack';

const splitPathKey = (pathKey: string): { pathname: string; search: string } => {
  const q = pathKey.indexOf('?');
  return q >= 0
    ? { pathname: pathKey.slice(0, q), search: pathKey.slice(q) }
    : { pathname: pathKey, search: '' };
};

/** Short title for a screen when it is the back destination; null when unknown. */
export const backLabelForPath = (pathKey: string): string | null => {
  const { pathname, search } = splitPathKey(pathKey);
  if (pathname === EXPLORE_MAP_PATH || pathname === '/explore') return 'Explore';
  if (pathname === LIST_DISCOVERY_PATH) return 'Browse';
  if (pathname === PLAN_PATH) return resolveMobileTabHeaderTitle(pathname, search) ?? PRODUCT_PLAN_SURFACE_TITLE;
  if (pathname.startsWith('/activity/')) return 'Outing';
  return resolveMobileTabHeaderTitle(pathname, search);
};

/**
 * Label for a back control given where it will actually land. The declared
 * label is kept when landing on the declared parent route; otherwise the real
 * destination names itself (or plain "Back").
 */
export const resolveBackLabel = (
  target: BackTarget,
  fallbackTo: string,
  declaredLabel: string
): string => {
  if (target.kind === 'fallback') return declaredLabel;
  if (splitPathKey(target.path).pathname === splitPathKey(fallbackTo).pathname) return declaredLabel;
  return backLabelForPath(target.path) ?? 'Back';
};
