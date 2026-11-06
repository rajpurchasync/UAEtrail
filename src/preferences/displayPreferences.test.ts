import { afterEach, describe, expect, it } from 'vitest';
import {
  clearGuestDisplayPreferences,
  DEFAULT_DISPLAY_PREFERENCES,
  readActiveDisplayPreferences,
  readGuestDisplayPreferences,
  writeDisplayPreferences,
  writeGuestDisplayPreferences,
} from './displayPreferences';

describe('displayPreferences guest vs account', () => {
  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores guest theme, clock, and units for the browser session only', () => {
    writeGuestDisplayPreferences({ theme: 'dark', clock: '24', units: 'imperial' });
    expect(readGuestDisplayPreferences()).toEqual({
      theme: 'dark',
      clock: '24',
      units: 'imperial',
    });
    expect(readActiveDisplayPreferences()).toEqual({
      theme: 'dark',
      clock: '24',
      units: 'imperial',
    });
    expect(window.localStorage.getItem('uaetrail:guest-display')).toBeNull();
    expect(window.sessionStorage.getItem('uaetrail:guest-display')).toBeTruthy();
    window.sessionStorage.clear();
    expect(readGuestDisplayPreferences()).toEqual(DEFAULT_DISPLAY_PREFERENCES);
  });

  it('resets guest prefs without changing saved account display prefs', () => {
    writeDisplayPreferences({ theme: 'light', clock: '12', units: 'metric' });
    writeGuestDisplayPreferences({ theme: 'dark', clock: '24', units: 'imperial' });
    window.localStorage.setItem('uaetrail_user', JSON.stringify({ id: 'u1' }));
    clearGuestDisplayPreferences();
    expect(readGuestDisplayPreferences()).toEqual(DEFAULT_DISPLAY_PREFERENCES);
    expect(readActiveDisplayPreferences()).toEqual({
      theme: 'light',
      clock: '12',
      units: 'metric',
    });
  });
});
