import { useEffect, useState } from 'react';
import {
  applyBootTheme,
  applyDisplayPreferences,
  DISPLAY_PREFERENCES_EVENT,
  hasAccountSession,
  readActiveDisplayPreferences,
  readGuestDisplayPreferences,
  type DisplayPreferences,
  type ThemePreference,
} from './displayPreferences';

export const useDisplayPreferences = (): DisplayPreferences => {
  const [preferences, setPreferences] = useState(readActiveDisplayPreferences);

  useEffect(() => {
    if (hasAccountSession()) applyDisplayPreferences(preferences);
    else applyBootTheme();
    const refresh = () => setPreferences(readActiveDisplayPreferences());
    window.addEventListener(DISPLAY_PREFERENCES_EVENT, refresh);
    const followSystem = hasAccountSession()
      ? preferences.theme === 'system'
      : readGuestDisplayPreferences().theme === 'system';
    if (!followSystem) return () => window.removeEventListener(DISPLAY_PREFERENCES_EVENT, refresh);
    let media: MediaQueryList | null = null;
    try {
      media = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      media = null;
    }
    const onScheme = () => applyBootTheme();
    media?.addEventListener('change', onScheme);
    return () => {
      window.removeEventListener(DISPLAY_PREFERENCES_EVENT, refresh);
      media?.removeEventListener('change', onScheme);
    };
  }, [preferences]);

  return preferences;
};

export const themePreferenceLabel = (theme: ThemePreference): string => {
  if (theme === 'dark') return 'Dark';
  if (theme === 'light') return 'Light';
  return 'System';
};
