import { PROFILE_PATH, PROFILE_SETTINGS_PATH } from '../config/routingCatalog';
import { PROFILE_VEHICLES_PATH } from '../config/surfacePaths';
import { useMobileBackChrome } from './useMobileBackChrome';

export const useProfileHubBackChrome = () =>
  useMobileBackChrome({ fallbackTo: PROFILE_PATH, label: 'Profile', backBehavior: 'fallback' });

export const useProfileSettingsBackChrome = () =>
  useMobileBackChrome({
    fallbackTo: PROFILE_SETTINGS_PATH,
    label: 'Settings',
    backBehavior: 'fallback',
  });

export const useProfileVehiclesBackChrome = () =>
  useMobileBackChrome({
    fallbackTo: PROFILE_VEHICLES_PATH,
    label: 'My cars',
    backBehavior: 'fallback',
  });
