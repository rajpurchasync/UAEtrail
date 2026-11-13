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
const GUEST_DISPLAY_KEY = 'uaetrail:guest-display';
const CHANGE_EVENT = 'uaetrail-display-preferences';

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  theme: 'light',
  clock: '12',
  units: 'metric',
};

const isTheme = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

const isClock = (value: unknown): value is ExploreClockStyle => value === '12' || value === '24';

const isUnits = (value: unknown): value is UnitSystem => value === 'metric' || value === 'imperial';

const parsePreferences = (raw: string | null): DisplayPreferences | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DisplayPreferences>;
    return {
      theme: isTheme(parsed.theme) ? parsed.theme : 'system',
      clock: isClock(parsed.clock) ? parsed.clock : '12',
      units: isUnits(parsed.units) ? parsed.units : 'metric',
    };
  } catch {
    return null;
  }
};

export const readDisplayPreferences = (): DisplayPreferences => {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_PREFERENCES;
  try {
    return parsePreferences(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_DISPLAY_PREFERENCES;
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
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const hasAccountSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.localStorage.getItem('uaetrail_user'));
  } catch {
    return false;
  }
};

const readGuestStore = (): string | null => {
  try {
    return window.sessionStorage.getItem(GUEST_DISPLAY_KEY);
  } catch {
    return null;
  }
};

export const readGuestDisplayPreferences = (): DisplayPreferences => {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_PREFERENCES;
  try {
    const fromSession = parsePreferences(readGuestStore());
    if (fromSession) return fromSession;
    return DEFAULT_DISPLAY_PREFERENCES;
  } catch {
    return DEFAULT_DISPLAY_PREFERENCES;
  }
};

export const readGuestTheme = (): ThemePreference => readGuestDisplayPreferences().theme;

export const readActiveDisplayPreferences = (): DisplayPreferences =>
  hasAccountSession() ? readDisplayPreferences() : readGuestDisplayPreferences();

export const applyDisplayPreferences = (preferences: DisplayPreferences = readDisplayPreferences()): void => {
  setExploreClockStyle(preferences.clock);
  if (typeof document === 'undefined') return;
  paintTheme(resolveTheme(preferences.theme));
};

/** Signed-out pages follow guest display prefs (theme, clock, units). */
export const applySignedOutTheme = (): void => {
  if (typeof document === 'undefined') return;
  const guest = readGuestDisplayPreferences();
  setExploreClockStyle(guest.clock);
  paintTheme(resolveTheme(guest.theme));
};

/** Signed-in pages use the saved display preference. Signed-out pages use the guest default. */
export const applyBootTheme = (): void => {
  if (hasAccountSession()) applyDisplayPreferences();
  else applySignedOutTheme();
};

export const writeGuestDisplayPreferences = (patch: Partial<DisplayPreferences>): DisplayPreferences => {
  const next = { ...readGuestDisplayPreferences(), ...patch };
  window.sessionStorage.setItem(GUEST_DISPLAY_KEY, JSON.stringify(next));
  applySignedOutTheme();
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
};

export const writeGuestTheme = (theme: ThemePreference): ThemePreference =>
  writeGuestDisplayPreferences({ theme }).theme;

/** Drop guest theme/clock/units so a new session does not keep signed-out choices. */
export const clearGuestDisplayPreferences = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(GUEST_DISPLAY_KEY);
  window.localStorage.removeItem(GUEST_DISPLAY_KEY);
  window.localStorage.removeItem(GUEST_THEME_KEY);
};

export const writeDisplayPreferences = (patch: Partial<DisplayPreferences>): DisplayPreferences => {
  const next = { ...readDisplayPreferences(), ...patch };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applyDisplayPreferences(next);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
};

export const writeActiveDisplayPreferences = (patch: Partial<DisplayPreferences>): DisplayPreferences =>
  hasAccountSession() ? writeDisplayPreferences(patch) : writeGuestDisplayPreferences(patch);

export const DISPLAY_PREFERENCES_EVENT = CHANGE_EVENT;
