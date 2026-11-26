/** W79 — guest welcome paths + map preview prefs (no guest sign-in / unlock UI). */
export {
  EXPLORE_WELCOME_FINISH_STATE,
  POST_SIGNUP_EXPLORE_PATH,
  resolveWelcomeFinishExplorePath,
  shouldOpenExploreLocationPromptFromWelcome,
  type ExploreWelcomeFinishState,
} from '../explore/exploreWelcomeNavigation';
export {
  readExploreGuestMapPreviewDismissed,
  writeExploreGuestMapPreviewDismissed,
} from '../explore/guestMapPreviewPolicy';