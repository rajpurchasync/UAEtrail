import type { AreaBoundsRing, AreaCenter } from '@uaetrail/shared-types';

/** Default map footprint when admin only supplies a center pin. */
export const boundsRingFromCenter = (
  center: AreaCenter,
  deltaDegrees = 0.045
): AreaBoundsRing => {
  const { latitude: lat, longitude: lng } = center;
  return [
    { latitude: lat - deltaDegrees, longitude: lng - deltaDegrees },
    { latitude: lat - deltaDegrees, longitude: lng + deltaDegrees },
    { latitude: lat + deltaDegrees, longitude: lng + deltaDegrees },
    { latitude: lat + deltaDegrees, longitude: lng - deltaDegrees },
  ];
};