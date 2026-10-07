import { isAppleMobileWeb, type NavigationAppId } from './mapLinks';

const STORAGE_KEY = 'uaetrail.preferredNavigationApp';

const isValidApp = (value: string): value is NavigationAppId =>
  value === 'google' || value === 'waze' || value === 'apple';

export const getPreferredNavigationApp = (): NavigationAppId | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || !isValidApp(raw)) return null;
    if (raw === 'apple' && !isAppleMobileWeb()) return null;
    return raw;
  } catch {
    return null;
  }
};

export const setPreferredNavigationApp = (app: NavigationAppId): void => {
  try {
    localStorage.setItem(STORAGE_KEY, app);
  } catch {
    /* ignore quota / private mode */
  }
};

export const clearPreferredNavigationApp = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};
