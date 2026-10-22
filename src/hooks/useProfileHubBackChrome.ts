import { PROFILE_PATH, PROFILE_SETTINGS_PATH } from '../config/routingCatalog';
import { useMobileBackChrome } from './useMobileBackChrome';

export const useProfileHubBackChrome = () =>
  useMobileBackChrome({ fallbackTo: PROFILE_PATH, label: 'Profile' });

export const useProfileSettingsBackChrome = () =>
  useMobileBackChrome({ fallbackTo: PROFILE_SETTINGS_PATH, label: 'Settings' });
