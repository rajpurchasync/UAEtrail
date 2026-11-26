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
export {
  EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES,
  EXPLORE_GUEST_MAP_PREVIEW_NOTICE,
  EXPLORE_SEARCH_GUEST_PLACEHOLDER,
  EXPLORE_SEARCH_GUEST_PREVIEW_NOTICE,
  EXPLORE_SEARCH_GUEST_WHERE_PLACEHOLDER,
} from '../explore/guestMapPreviewCopy';