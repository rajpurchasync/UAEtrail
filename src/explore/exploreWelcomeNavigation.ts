import { shouldShowExploreLocationPrompt } from './exploreMapLocationPreference';

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
