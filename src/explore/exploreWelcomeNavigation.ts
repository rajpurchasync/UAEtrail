import { EXPLORE_MAP_PATH } from '../config/platform';
import { PLAN_PATH } from '../config/surfacePaths';
import { shouldShowExploreLocationPrompt } from './exploreMapLocationPreference';

/** Trips map home — default landing after signup profile wizard. */
export const POST_SIGNUP_EXPLORE_PATH = EXPLORE_MAP_PATH;

/**
 * After `/welcome`, send new members to the Trips map — not My Plans or other gated hubs
 * they may have opened before signing in.
 */
export const resolveWelcomeFinishExplorePath = (redirectTo?: string | null): string => {
  const raw = redirectTo?.trim();
  if (!raw) return POST_SIGNUP_EXPLORE_PATH;
  const pathname = raw.split('?')[0]?.split('#')[0] ?? '';
  if (pathname === PLAN_PATH || pathname.startsWith(`${PLAN_PATH}/`)) {
    return POST_SIGNUP_EXPLORE_PATH;
  }
  if (pathname === '/' || pathname === '/profile' || pathname.startsWith('/profile/')) {
    return POST_SIGNUP_EXPLORE_PATH;
  }
  return raw;
};

/** Router state set when `/welcome` sends the member to Explore after profile completion. */
export const EXPLORE_WELCOME_FINISH_STATE = { showExploreLocationPrompt: true } as const;

export type ExploreWelcomeFinishState = typeof EXPLORE_WELCOME_FINISH_STATE;

/** True when welcome navigation requests the soft map location prompt and prefs allow it. */
export const shouldOpenExploreLocationPromptFromWelcome = (
  locationState: unknown,
  allowPrompt: () => boolean = shouldShowExploreLocationPrompt
): boolean => {
  const navState = locationState as { showExploreLocationPrompt?: boolean } | null;
  return Boolean(navState?.showExploreLocationPrompt && allowPrompt());
};
