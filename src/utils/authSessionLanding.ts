import { EXPLORE_MAP_PATH } from '../config/platform';
import {
  SESSION_EXPIRED_QUERY_KEY,
  SESSION_EXPIRED_QUERY_VALUE,
  sessionExpiredHomePath,
} from '../config/surfacePaths';

const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)';

/** Matches `useIsMobile` — marketing home is desktop/tablet; phone uses Explore. */
export const isMobileAuthViewport = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;

export const sessionExpiredExplorePath = (): string =>
  `${EXPLORE_MAP_PATH}?${SESSION_EXPIRED_QUERY_KEY}=${SESSION_EXPIRED_QUERY_VALUE}`;

/** Desktop: guest marketing home. Phone: Explore map. */
export const sessionExpiredLandingPath = (): string =>
  isMobileAuthViewport() ? sessionExpiredExplorePath() : sessionExpiredHomePath();

/** After logout — never send phones back to the marketing page. */
export const signedOutLandingPath = (): string =>
  isMobileAuthViewport() ? EXPLORE_MAP_PATH : '/';
