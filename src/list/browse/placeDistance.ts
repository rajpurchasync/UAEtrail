import type { UnitSystem } from '../../preferences/displayPreferences';

export type ViewerFix = { lat: number; lng: number };

const EARTH_METERS = 6_371_000;

/** Great-circle distance. Pure math on coordinates the list already has. */
export const distanceMeters = (from: ViewerFix, lat: number, lng: number): number => {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat - from.lat);
  const dLng = toRad(lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const formatPlaceDistance = (meters: number, units: UnitSystem): string => {
  if (units === 'imperial') {
    const feet = meters * 3.28084;
    if (feet < 1000) return `${Math.round(feet)} ft`;
    const miles = meters / 1609.344;
    return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
};