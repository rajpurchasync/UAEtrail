/**
 * Decode an encoded polyline (precision 5 by default) into `[lat, lng][]`.
 * Same algorithm as common map providers use for route paths.
 */
export const decodeGooglePolyline = (encoded: string, precision = 5): [number, number][] => {
  const trimmed = encoded?.trim();
  if (!trimmed) return [];

  const factor = 10 ** precision;
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < trimmed.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = trimmed.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      b = trimmed.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
};
