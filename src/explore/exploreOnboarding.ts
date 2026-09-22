/** localStorage keys for explore onboarding UX. */
export const EXPLORE_COACH_SEEN_KEY = 'uaetrail:explore-coach-seen';

export const hasSeenExploreCoach = (): boolean => {
  try {
    return localStorage.getItem(EXPLORE_COACH_SEEN_KEY) === '1';
  } catch {
    return true;
  }
};
