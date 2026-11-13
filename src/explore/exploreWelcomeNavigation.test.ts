import { describe, expect, it } from 'vitest';
import { PLAN_PATH } from '../config/routingCatalog';
import {
  EXPLORE_WELCOME_FINISH_STATE,
  POST_SIGNUP_EXPLORE_PATH,
  resolveWelcomeFinishExplorePath,
  shouldOpenExploreLocationPromptFromWelcome,
} from './exploreWelcomeNavigation';

describe('exploreWelcomeNavigation', () => {
  it('uses a stable finish state for welcome → explore', () => {
    expect(EXPLORE_WELCOME_FINISH_STATE).toEqual({ showExploreLocationPrompt: true });
  });

  it('sends post-signup welcome finish to Trips map, not My Plans', () => {
    expect(resolveWelcomeFinishExplorePath(undefined)).toBe(POST_SIGNUP_EXPLORE_PATH);
    expect(resolveWelcomeFinishExplorePath(PLAN_PATH)).toBe(POST_SIGNUP_EXPLORE_PATH);
    expect(resolveWelcomeFinishExplorePath(`${PLAN_PATH}?filter=upcoming`)).toBe(POST_SIGNUP_EXPLORE_PATH);
    expect(resolveWelcomeFinishExplorePath('/explore?list=1')).toBe('/explore?list=1');
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
