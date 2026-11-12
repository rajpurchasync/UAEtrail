import { PROFILE_PATH, PROFILE_SETTINGS_PATH } from '../config/routingCatalog';
import { SETTINGS_SURFACE_TITLE } from '../config/settingsHub';
import { BUDDIES_PATH, PROFILE_VEHICLES_PATH } from '../config/surfacePaths';
import { PRODUCT_SOCIAL_SURFACE_TITLE } from '../content/productNorthStar';
import { useMobileBackChrome } from './useMobileBackChrome';

export const useProfileHubBackChrome = () =>
  useMobileBackChrome({ fallbackTo: PROFILE_PATH, label: 'Profile', backBehavior: 'fallback' });

export const useProfileSettingsBackChrome = () =>
  useMobileBackChrome({
    fallbackTo: PROFILE_SETTINGS_PATH,
    label: SETTINGS_SURFACE_TITLE,
    backBehavior: 'fallback',
  });

export const useProfileVehiclesBackChrome = () =>
  useMobileBackChrome({
    fallbackTo: PROFILE_VEHICLES_PATH,
    label: 'My cars',
    backBehavior: 'fallback',
  });

/** Child Social screens (Friends, Groups, …) — one shell back to the Social hub. */
export const useSocialHubBackChrome = () =>
  useMobileBackChrome({
    fallbackTo: BUDDIES_PATH,
    label: PRODUCT_SOCIAL_SURFACE_TITLE,
    backBehavior: 'fallback',
  });
