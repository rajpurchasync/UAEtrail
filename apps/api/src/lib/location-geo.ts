export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

const EARTH_RADIUS_KM = 6378.1;

export const toGeoPoint = (
  latitude: number | null | undefined,
  longitude: number | null | undefined
): GeoPoint | null => {
  if (latitude == null || longitude == null) return null;
  return { type: 'Point', coordinates: [longitude, latitude] };
};

export const withGeoPointOnDoc = (
  latitude: number | null | undefined,
  longitude: number | null | undefined
): { geo?: GeoPoint } => {
  const geo = toGeoPoint(latitude, longitude);
  return geo ? { geo } : {};
};

export const withLocationGeoFields = <T extends { latitude: number | null; longitude: number | null }>(
  doc: T
): T & { geo?: GeoPoint } => {
  const geo = toGeoPoint(doc.latitude, doc.longitude);
  return geo ? { ...doc, geo } : doc;
};

export const radiusKmToRadians = (radiusKm: number): number => radiusKm / EARTH_RADIUS_KM;
