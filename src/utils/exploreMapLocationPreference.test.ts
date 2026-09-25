import { describe, expect, it, beforeEach } from 'vitest';
import {
  getExploreMapLocationPreference,
  saveExploreMapLocationPreference,
  shouldShowExploreLocationPrompt,
} from './exploreMapLocationPreference';

describe('exploreMapLocationPreference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows prompt when device location not enabled and not dismissed', () => {
    expect(shouldShowExploreLocationPrompt()).toBe(true);
  });

  it('hides prompt after dismiss or opt-in', () => {
    saveExploreMapLocationPreference({ promptDismissed: true });
    expect(shouldShowExploreLocationPrompt()).toBe(false);

    localStorage.clear();
    saveExploreMapLocationPreference({ useDeviceLocation: true });
    expect(shouldShowExploreLocationPrompt()).toBe(false);
    expect(getExploreMapLocationPreference().useDeviceLocation).toBe(true);
  });
});
