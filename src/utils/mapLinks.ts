/**
 * External map URLs for pinned coordinates (place, venue, activity meeting point, shop, etc.).
 *
 * **Consumer UI contract** (`docs/DOMAIN_CANONICALS.md` §14):
 * - **Navigate (drive):** `DirectionsControl` / `PlaceDirectionLinks` only — not raw `href`s.
 * - **View pin:** `ViewOnMapLink` or `buildGoogleMapsSearchUrl` via that component.
 * - **In-app Leaflet previews:** `MeetingPointMap`, `MapPlacePicker` — no third-party drive links on the tile.
 *
 * Do not add new `google.com/maps` or `waze.com` string literals outside this module (enforced by test).
 */
export type NavigationAppId = 'google' | 'waze' | 'apple';

export type NavigationMode = 'drive' | 'view';

export const buildGoogleMapsSearchUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const buildGoogleDriveUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

export const buildWazeDriveUrl = (lat: number, lng: number): string =>
  `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

export const buildWazeViewUrl = (lat: number, lng: number): string =>
  `https://waze.com/ul?ll=${lat},${lng}`;

export const buildAppleMapsDriveUrl = (lat: number, lng: number): string =>
  `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;

export const buildAppleMapsSearchUrl = (lat: number, lng: number): string =>
  `https://maps.apple.com/?ll=${lat},${lng}&q=Location`;

/** iPhone / iPad browsers — show Apple Maps in the picker. */
export const isAppleMobileWeb = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
};

export const buildNavigationUrl = (
  app: NavigationAppId,
  lat: number,
  lng: number,
  mode: NavigationMode = 'drive'
): string => {
  if (mode === 'view') {
    switch (app) {
      case 'waze':
        return buildWazeViewUrl(lat, lng);
      case 'apple':
        return buildAppleMapsSearchUrl(lat, lng);
      default:
        return buildGoogleMapsSearchUrl(lat, lng);
    }
  }
  switch (app) {
    case 'waze':
      return buildWazeDriveUrl(lat, lng);
    case 'apple':
      return buildAppleMapsDriveUrl(lat, lng);
    default:
      return buildGoogleDriveUrl(lat, lng);
  }
};

export const openNavigationUrl = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export interface NavigationAppOption {
  id: NavigationAppId;
  label: string;
  description: string;
}

export const listNavigationAppOptions = (): NavigationAppOption[] => {
  const options: NavigationAppOption[] = [
    { id: 'google', label: 'Google Maps', description: 'Navigate with Google' },
    { id: 'waze', label: 'Waze', description: 'Navigate with Waze' },
  ];
  if (isAppleMobileWeb()) {
    options.push({ id: 'apple', label: 'Apple Maps', description: 'Navigate with Apple Maps' });
  }
  return options;
};
