import type { DedupeKeys, GeoPointWire, GeoRef } from './geo-hierarchy.js';
import type { FacilityType } from './detail-revamp-enums.js';

const STOP = new Set([
  'the',
  'al',
  'el',
  'wadi',
  'jebel',
  'jabal',
  'camp',
  'area',
  'park',
  'parking',
  'car',
  'point',
  'spot',
  'trail',
  'loop',
  'station',
]);

/** Normalised name key for duplicate detection (plan §20.2). */
export const nameKey = (raw: string): string =>
  raw
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0627\u0654/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064a')
    .replace(/[\u064b-\u0652]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .sort()
    .join(' ');

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export const geohashEncode = (lat: number, lng: number, precision: number): string => {
  let minLat = -90;
  let maxLat = 90;
  let minLng = -180;
  let maxLng = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let even = true;
  while (hash.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        ch |= 1 << (4 - bit);
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    even = !even;
    if (bit < 4) {
      bit += 1;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
};

const geohashDecode = (hash: string): { lat: number; lng: number; latErr: number; lngErr: number } => {
  let minLat = -90;
  let maxLat = 90;
  let minLng = -180;
  let maxLng = 180;
  let even = true;
  for (const c of hash) {
    const cd = BASE32.indexOf(c);
    for (let mask = 16; mask > 0; mask >>= 1) {
      if (even) {
        const mid = (minLng + maxLng) / 2;
        if (cd & mask) minLng = mid;
        else maxLng = mid;
      } else {
        const mid = (minLat + maxLat) / 2;
        if (cd & mask) minLat = mid;
        else maxLat = mid;
      }
      even = !even;
    }
  }
  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
    latErr: (maxLat - minLat) / 2,
    lngErr: (maxLng - minLng) / 2,
  };
};

const neighbourHashes = (hash: string): string[] => {
  const { lat, lng, latErr, lngErr } = geohashDecode(hash);
  const precision = hash.length;
  const out = new Set<string>();
  for (const dLat of [-latErr * 2, 0, latErr * 2]) {
    for (const dLng of [-lngErr * 2, 0, lngErr * 2]) {
      if (dLat === 0 && dLng === 0) continue;
      const nLat = Math.min(90, Math.max(-90, lat + dLat));
      const nLng = ((((lng + dLng + 180) % 360) + 360) % 360) - 180;
      out.add(geohashEncode(nLat, nLng, precision));
    }
  }
  return [...out];
};

export type DedupeKind = 'area' | 'venue' | 'trail' | 'camp_spot' | 'facility' | 'edit';

export const primaryGeohashPrecision = (kind: DedupeKind): number => {
  if (kind === 'facility') return 8;
  if (kind === 'camp_spot') return 7;
  if (kind === 'trail' || kind === 'venue') return 6;
  return 5;
};

/** Four prefix cells plus eight neighbours at primary precision. */
export const cellsFor = (
  geo: GeoPointWire | { latitude: number; longitude: number },
  kind: DedupeKind
): string[] => {
  const lat = 'coordinates' in geo ? geo.coordinates[1] : geo.latitude;
  const lng = 'coordinates' in geo ? geo.coordinates[0] : geo.longitude;
  const primary = primaryGeohashPrecision(kind);
  const g8 = geohashEncode(lat, lng, 8);
  const g7 = g8.slice(0, 7);
  const g6 = g8.slice(0, 6);
  const g5 = g8.slice(0, 5);
  const primaryHash = geohashEncode(lat, lng, primary);
  return [...new Set([g8, g7, g6, g5, primaryHash, ...neighbourHashes(primaryHash)])];
};

export const phoneKey = (raw?: string | null): string | undefined => {
  const digits = raw?.replace(/\D+/g, '') ?? '';
  if (digits.length < 7) return undefined;
  return digits.slice(-9);
};

export const domainKey = (url?: string | null): string | undefined => {
  if (!url?.trim()) return undefined;
  try {
    const host = new URL(url.includes('://') ? url : `https://${url}`).hostname.toLowerCase();
    return host.replace(/^www\./, '') || undefined;
  } catch {
    return undefined;
  }
};

export const buildDedupeKeys = (input: {
  name: string;
  geo: GeoPointWire | { latitude: number; longitude: number };
  kind: DedupeKind;
  phone?: string | null;
  website?: string | null;
}): DedupeKeys => ({
  nameKey: nameKey(input.name),
  cells: cellsFor(input.geo, input.kind),
  phoneKey: phoneKey(input.phone),
  domainKey: domainKey(input.website),
});

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'withdrawn';

export type SubmissionCandidate = {
  id: string;
  source: 'live' | 'pending';
  distanceM: number;
  nameScore: number;
  verdict: 'near_certain' | 'possible';
  name?: string;
};

export type SubmissionDoc = {
  _id: string;
  kind: DedupeKind;
  facilityType?: FacilityType;
  status: SubmissionStatus;
  payload: Record<string, unknown>;
  dedupe: DedupeKeys;
  geo: GeoPointWire;
  geoRef?: GeoRef;
  targetId?: string;
  candidates: SubmissionCandidate[];
  insisted?: { reason: string; note?: string; at: Date | string };
  submittedBy: string;
  seconded: string[];
  photos: string[];
  review?: {
    by: string;
    at: Date | string;
    action: 'approve' | 'reject' | 'merge';
    reason?: string;
    mergedInto?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type SubmissionPublicDTO = {
  id: string;
  kind: DedupeKind;
  facilityType?: FacilityType;
  status: SubmissionStatus;
  name: string;
  candidates: SubmissionCandidate[];
  createdAt: string;
};

/** Admin review queue row — `GET /admin/submissions`. */
export type AdminSubmissionDTO = SubmissionPublicDTO & {
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  proposedAreaName: string | null;
  insisted?: { reason: string; note?: string; at?: string };
  submittedBy: string;
  /** Count of other members who seconded this suggestion. */
  seconded: number;
};

export const trigramRatio = (a: string, b: string): number => {
  const grams = (s: string): Set<string> => {
    const t = `  ${s} `;
    const out = new Set<string>();
    for (let i = 0; i < t.length - 2; i += 1) out.add(t.slice(i, i + 3));
    return out;
  };
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  for (const g of A) if (B.has(g)) inter += 1;
  return (2 * inter) / (A.size + B.size);
};

export type DuplicateVerdict = 'near_certain' | 'possible' | 'no';

export const scoreDuplicate = (input: {
  kind: DedupeKind;
  distanceM: number;
  nameScore: number;
  samePhoneOrDomain?: boolean;
  /** When GPX/route sampling is missing, trails use start-point distance only (plan §20.2). */
  hasRouteKey?: boolean;
}): { verdict: DuplicateVerdict; confidence: number } => {
  const { kind, distanceM, nameScore, samePhoneOrDomain, hasRouteKey } = input;
  if (kind === 'facility') {
    if (samePhoneOrDomain) return { verdict: 'near_certain', confidence: 0.9 };
    if (distanceM < 25) return { verdict: 'near_certain', confidence: 0.95 };
    if (distanceM <= 100) return { verdict: 'possible', confidence: 0.6 };
    if (distanceM < 500 && nameScore > 0.5) return { verdict: 'possible', confidence: 0.55 };
    return { verdict: 'no', confidence: 0 };
  }
  if (kind === 'camp_spot') {
    if (distanceM < 150) return { verdict: 'near_certain', confidence: 0.9 };
    if (distanceM <= 500 && nameScore > 0.5) return { verdict: 'possible', confidence: 0.55 };
    return { verdict: 'no', confidence: 0 };
  }
  if (kind === 'trail') {
    if (!hasRouteKey) {
      if (distanceM < 300) return { verdict: 'near_certain', confidence: 0.82 };
      if (distanceM < 1000 && nameScore > 0.6) return { verdict: 'possible', confidence: 0.5 };
      return { verdict: 'no', confidence: 0 };
    }
    if (distanceM < 300 && nameScore > 0.5) return { verdict: 'near_certain', confidence: 0.85 };
    if (distanceM < 1000 && nameScore > 0.6) return { verdict: 'possible', confidence: 0.5 };
    return { verdict: 'no', confidence: 0 };
  }
  if (kind === 'venue') {
    if ((distanceM < 300 && nameScore > 0.6) || samePhoneOrDomain) {
      return { verdict: 'near_certain', confidence: 0.88 };
    }
    if (distanceM < 1000) return { verdict: 'possible', confidence: 0.5 };
    return { verdict: 'no', confidence: 0 };
  }
  if (nameScore > 0.7) return { verdict: 'near_certain', confidence: 0.8 };
  if (distanceM < 5000) return { verdict: 'possible', confidence: 0.45 };
  return { verdict: 'no', confidence: 0 };
};
