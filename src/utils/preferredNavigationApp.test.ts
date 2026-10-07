import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPreferredNavigationApp,
  getPreferredNavigationApp,
  setPreferredNavigationApp,
} from './preferredNavigationApp';

describe('preferredNavigationApp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('returns null when unset', () => {
    expect(getPreferredNavigationApp()).toBeNull();
  });

  it('persists google and waze', () => {
    setPreferredNavigationApp('waze');
    expect(getPreferredNavigationApp()).toBe('waze');
    setPreferredNavigationApp('google');
    expect(getPreferredNavigationApp()).toBe('google');
  });

  it('ignores apple preference off iOS', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Android',
      platform: 'Linux',
      maxTouchPoints: 0,
    });
    setPreferredNavigationApp('apple');
    expect(getPreferredNavigationApp()).toBeNull();
  });

  it('clear removes stored value', () => {
    setPreferredNavigationApp('google');
    clearPreferredNavigationApp();
    expect(getPreferredNavigationApp()).toBeNull();
  });
});
