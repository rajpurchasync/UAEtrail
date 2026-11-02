import { setExploreClockStyle, type ExploreClockStyle } from '@uaetrail/shared-types';

export type ThemePreference = 'system' | 'light' | 'dark';
export type UnitSystem = 'metric' | 'imperial';

export type DisplayPreferences = {
  theme: ThemePreference;
  clock: ExploreClockStyle;
  units: UnitSystem;
};

const STORAGE_KEY = 'uaetrail:display';
const GUEST_THEME_KEY = 'uaetrail:guest-theme';
const SESSION_KEY = 'uaetrail_session';
const CHANGE_EVENT = 'uaetrail-display-preferences';

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  theme: 'system',
  clock: '12',
  units: 'metric',
};

const isTheme = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

const isClock = (value: unknown): value is ExploreClockStyle => value === '12' || value === '24';

const isUnits = (value: unknown): value is UnitSystem => value === 'metric' || value === 'imperial';

export const readDisplayPreferences = (): DisplayPreferences => {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DISPLAY_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<DisplayPreferences>;
    return {
      theme: isTheme(parsed.theme) ? parsed.theme : 'system',
      clock: isClock(parsed.clock) ? parsed.clock : '12',
      units: isUnits(parsed.units) ? parsed.units : 'metric',
    };
  } catch {
    return DEFAULT_DISPLAY_PREFERENCES;
  }
};

/** Light when the system theme cannot be read. */
export const resolveTheme = (preference: ThemePreference): 'light' | 'dark' => {
  if (preference === 'light' || preference === 'dark') return preference;
  try {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    return 'light';
  }
  return 'light';
};

const paintTheme = (theme: 'light' | 'dark'): void => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

export const hasAccountSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return Boolean(parsed?.accessToken);
  } catch {
    return false;
  }
};

export const readGuestTheme = (): ThemePreference => {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = window.localStorage.getItem(GUEST_THEME_KEY);
    return isTheme(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
};

export const applyDisplayPreferences = (preferences: DisplayPreferences = readDisplayPreferences()): void => {
  setExploreClockStyle(preferences.clock);
  if (typeof document === 'undefined') return;
  paintTheme(resolveTheme(preferences.theme));
};

/** Signed-out pages follow the guest choice, which defaults to the system theme. */
export const applySignedOutTheme = (): void => {
  if (typeof document === 'undefined') return;
  setExploreClockStyle(readDisplayPreferences().clock);
  paintTheme(resolveTheme(readGuestTheme()));
};

/** Signed-in pages use the saved display preference. Signed-out pages use the guest default. */
export const applyBootTheme = (): void => {
  if (hasAccountSession()) applyDisplayPreferences();
  else applySignedOutTheme();
};

export const writeGuestTheme = (theme: ThemePreference): ThemePreference => {
  window.localStorage.setItem(GUEST_THEME_KEY, theme);
  applySignedOutTheme();
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return theme;
};

export const writeDisplayPreferences = (patch: Partial<DisplayPreferences>): DisplayPreferences => {
  const next = { ...readDisplayPreferences(), ...patch };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applyDisplayPreferences(next);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
};

export const DISPLAY_PREFERENCES_EVENT = CHANGE_EVENT;
