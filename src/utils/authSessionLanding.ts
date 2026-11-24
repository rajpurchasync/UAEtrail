import { EXPLORE_MAP_PATH } from '../config/platform';
import {
  SESSION_EXPIRED_QUERY_KEY,
  SESSION_EXPIRED_QUERY_VALUE,
  sessionExpiredHomePath,
} from '../config/surfacePaths';
import { EXPLORE_SEARCH_RESULTS_PATH } from '../explore/search/exploreSearchRouting';

const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)';

/** Matches `useIsMobile` — marketing home is desktop/tablet; phone uses Explore. */
export const isMobileAuthViewport = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;

export const sessionExpiredExplorePath = (): string =>
  `${EXPLORE_MAP_PATH}?${SESSION_EXPIRED_QUERY_KEY}=${SESSION_EXPIRED_QUERY_VALUE}`;

export const withSessionExpiredQuery = (pathname: string, search = ''): string => {
  const params = new URLSearchParams(search.replace(/^\?/, ''));
  params.set(SESSION_EXPIRED_QUERY_KEY, SESSION_EXPIRED_QUERY_VALUE);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
};

export const isExploreSearchSessionPreservePath = (pathname: string): boolean =>
  pathname === EXPLORE_SEARCH_RESULTS_PATH;

/** Desktop: guest marketing home. Phone: explore map — preserve `/explore/search` when already there. */
export const sessionExpiredLandingPath = (): string => {
  if (typeof window !== 'undefined') {
    const { pathname, search } = window.location;
    if (isExploreSearchSessionPreservePath(pathname)) {
      return withSessionExpiredQuery(pathname, search);
    }
  }
  return isMobileAuthViewport() ? sessionExpiredExplorePath() : sessionExpiredHomePath();
};

/** After logout — never send phones back to the marketing page. */
export const signedOutLandingPath = (): string =>
  isMobileAuthViewport() ? EXPLORE_MAP_PATH : '/';

/**
 * Drop `?session=expired` from a return path so a successful sign-in does not
 * re-show the session-expired toast on Explore / Home.
 */
export const stripSessionExpiredQuery = (path: string): string => {
  const hashIndex = path.indexOf('#');
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const queryIndex = withoutHash.indexOf('?');
  if (queryIndex < 0) return path;
  const pathname = withoutHash.slice(0, queryIndex);
  const params = new URLSearchParams(withoutHash.slice(queryIndex + 1));
  if (params.get(SESSION_EXPIRED_QUERY_KEY) !== SESSION_EXPIRED_QUERY_VALUE) {
    return path;
  }
  params.delete(SESSION_EXPIRED_QUERY_KEY);
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ''}${hash}`;
};
