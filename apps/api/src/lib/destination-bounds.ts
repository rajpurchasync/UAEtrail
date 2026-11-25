import type { DestinationBoundsRing, DestinationCenter } from '@uaetrail/shared-types';

/** Default map footprint when admin only supplies a center pin. */
export const boundsRingFromCenter = (
  center: DestinationCenter,
  deltaDegrees = 0.045
): DestinationBoundsRing => {
  const { latitude: lat, longitude: lng } = center;
  return [
    { latitude: lat - deltaDegrees, longitude: lng - deltaDegrees },
    { latitude: lat - deltaDegrees, longitude: lng + deltaDegrees },
    { latitude: lat + deltaDegrees, longitude: lng + deltaDegrees },
    { latitude: lat + deltaDegrees, longitude: lng - deltaDegrees },
  ];
};