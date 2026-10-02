import { describe, expect, it } from 'vitest';
import {
  EXPLORE_WELCOME_FINISH_STATE,
  shouldOpenExploreLocationPromptFromWelcome,
} from './exploreWelcomeNavigation';

describe('exploreWelcomeNavigation', () => {
  it('uses a stable finish state for welcome → explore', () => {
    expect(EXPLORE_WELCOME_FINISH_STATE).toEqual({ showExploreLocationPrompt: true });
  });

  it('opens location prompt only when welcome state and prefs allow', () => {
    expect(shouldOpenExploreLocationPromptFromWelcome(null, () => true)).toBe(false);
    expect(
      shouldOpenExploreLocationPromptFromWelcome(EXPLORE_WELCOME_FINISH_STATE, () => false)
    ).toBe(false);
    expect(
      shouldOpenExploreLocationPromptFromWelcome(EXPLORE_WELCOME_FINISH_STATE, () => true)
    ).toBe(true);
  });
});
