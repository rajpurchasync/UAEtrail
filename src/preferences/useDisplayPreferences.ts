import { useEffect, useState } from 'react';
import {
  applyBootTheme,
  applyDisplayPreferences,
  DISPLAY_PREFERENCES_EVENT,
  hasAccountSession,
  readDisplayPreferences,
  readGuestTheme,
  type DisplayPreferences,
  type ThemePreference,
} from './displayPreferences';

export const useDisplayPreferences = (): DisplayPreferences => {
  const [preferences, setPreferences] = useState(readDisplayPreferences);

  useEffect(() => {
    if (hasAccountSession()) applyDisplayPreferences(preferences);
    else applyBootTheme();
    const refresh = () => setPreferences(readDisplayPreferences());
    window.addEventListener(DISPLAY_PREFERENCES_EVENT, refresh);
    const followSystem = hasAccountSession() ? preferences.theme === 'system' : readGuestTheme() === 'system';
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
