/**
 * Derive public map preview fields from GPX (`trkpt` points) — bbox, encoded polyline, distance/elevation profile.
 * Plan §13.5: polyline ≤ ~500 points, profile ≤ ~200 samples.
 */
import { readStoredFile } from './stored-file-read.js';

export type GpxTrackPoint = { lat: number; lng: number; eleM?: number };

const MAX_POLYLINE_POINTS = 500;
const MAX_PROFILE_POINTS = 200;

/** Haversine distance in meters between WGS84 coordinates. */
const distanceMeters = (a: GpxTrackPoint, b: GpxTrackPoint): number => {
  const R = 6371000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

/** Encode [lat,lng][] to Google polyline precision 5. */
export const encodeGooglePolyline = (path: [number, number][], precision = 5): string => {
  let result = '';
  let prevLat = 0;
  let prevLng = 0;
  const factor = 10 ** precision;
  for (const [lat, lng] of path) {
    const ilat = Math.round(lat * factor);
    const ilng = Math.round(lng * factor);
    const dLat = ilat - prevLat;
    const dLng = ilng - prevLng;
    prevLat = ilat;
    prevLng = ilng;
    const encodeSigned = (v: number) => {
      let s = v << 1;
      if (v < 0) s = ~s;
      let chunk = '';
      while (s >= 0x20) {
        chunk += String.fromCharCode((0x20 | (s & 0x1f)) + 63);
        s >>= 5;
      }
      chunk += String.fromCharCode(s + 63);
      return chunk;
    };
    result += encodeSigned(dLat);
    result += encodeSigned(dLng);
  }
  return result;
};

/** Uniform stride keep at most `max` points including first and last. */
const samplePoints = <T>(points: T[], max: number): T[] => {
  if (points.length <= max) return points;
  const out: T[] = [];
  const stride = (points.length - 1) / (max - 1);
  for (let i = 0; i < max - 1; i++) {
    out.push(points[Math.round(i * stride)]);
  }
  out.push(points[points.length - 1]!);
  return out;
};

export const parseGpxTrackPoints = (gpxXml: string): GpxTrackPoint[] => {
  const points: GpxTrackPoint[] = [];
  const trkptRe = /<trkpt\s+([^>]+)>([\s\S]*?)<\/trkpt>/gi;
  let m: RegExpExecArray | null;
  while ((m = trkptRe.exec(gpxXml)) !== null) {
    const attrs = m[1]!;
    const body = m[2]!;
    const latM = /lat="([^"]+)"/i.exec(attrs);
    const lonM = /lon="([^"]+)"/i.exec(attrs);
    if (!latM || !lonM) continue;
    const lat = Number(latM[1]);
    const lng = Number(lonM[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const eleM = /<ele>([\d.-]+)<\/ele>/i.exec(body);
    const ele = eleM ? Number(eleM[1]) : undefined;
    points.push({
      lat,
      lng,
      ...(ele != null && Number.isFinite(ele) ? { eleM: ele } : {}),
    });
  }
  return points;
};

export type TrackPreviewFields = {
  bbox: [number, number, number, number];
  polyline: string;
  profile: [number, number][];
};

export const buildTrackPreviewFromGpxPoints = (points: GpxTrackPoint[]): TrackPreviewFields | null => {
  if (points.length < 2) return null;

  let minLng = points[0]!.lng;
  let maxLng = points[0]!.lng;
  let minLat = points[0]!.lat;
  let maxLat = points[0]!.lat;
  for (const p of points) {
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
  }
  const bbox: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];

  const sampled = samplePoints(points, MAX_POLYLINE_POINTS);
  const latlngs: [number, number][] = sampled.map((p) => [p.lat, p.lng]);
  const polyline = encodeGooglePolyline(latlngs);

  let cumulative = 0;
  const rawProfile: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    if (i > 0) cumulative += distanceMeters(points[i - 1]!, p);
    if (p.eleM != null && Number.isFinite(p.eleM)) {
      rawProfile.push([cumulative, p.eleM]);
    }
  }

  let profile: [number, number][];
  if (rawProfile.length >= 2) {
    profile = samplePoints(rawProfile, MAX_PROFILE_POINTS);
  } else {
    profile = [];
  }

  return { bbox, polyline, profile };
};

/** Load GPX from storage key; returns null if missing, invalid, or fewer than two track points. */
export const loadTrackPreviewFieldsFromGpxKey = async (gpxKey: string): Promise<TrackPreviewFields | null> => {
  const trimmed = gpxKey?.trim();
  if (!trimmed) return null;
  try {
    const { buffer } = await readStoredFile(trimmed);
    const xml = buffer.toString('utf8');
    const points = parseGpxTrackPoints(xml);
    return buildTrackPreviewFromGpxPoints(points);
  } catch {
    return null;
  }
};
