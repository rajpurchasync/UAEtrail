import type { PublicActiveAlertDTO } from '@uaetrail/shared-types';
import { listPlatformAlertsInTimeWindow } from '../lib/platform-alerts-store.js';

const EARTH_RADIUS_M = 6_371_000;

const haversineMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const rlat1 = (a.lat * Math.PI) / 180;
  const rlat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(rlat1) * Math.cos(rlat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
};

const normalizeRegion = (value: string | null | undefined): string | null => {
  const t = value?.trim().toLowerCase() ?? '';
  return t.length > 0 ? t : null;
};

const mapDoc = (doc: {
  _id: string;
  severity: PublicActiveAlertDTO['severity'];
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  scope: PublicActiveAlertDTO['scope'];
  region?: string | null;
}): PublicActiveAlertDTO => ({
  id: doc._id,
  severity: doc.severity,
  title: doc.title,
  body: doc.body,
  linkUrl: doc.linkUrl?.trim() || null,
  linkLabel: doc.linkLabel?.trim() || null,
  scope: doc.scope,
  region: doc.region?.trim() || null,
});

export type ListActivePlatformAlertsInput = {
  /** Viewer coordinates — required for `point` scoped rows. */
  lat: number;
  lng: number;
  /** Search radius around the point (km). */
  radiusKm: number;
  /** Optional coarse region (e.g. place/activity `region` field) for `region` scope. */
  region?: string | null;
};

/**
 * Active platform alerts for public detail surfaces.
 * Global rows always match; region rows match normalized region string; point rows match haversine distance.
 */
export const listActivePlatformAlertsForContext = async (
  input: ListActivePlatformAlertsInput
): Promise<PublicActiveAlertDTO[]> => {
  const now = new Date();
  const raw = await listPlatformAlertsInTimeWindow(now);
  const viewerRegion = normalizeRegion(input.region);
  const maxM = Math.max(1, input.radiusKm) * 1000;
  const viewer = { lat: input.lat, lng: input.lng };

  const out: PublicActiveAlertDTO[] = [];
  for (const row of raw) {
    if (row.scope === 'global') {
      out.push(mapDoc(row));
      continue;
    }
    if (row.scope === 'region') {
      const rowRegion = normalizeRegion(row.region);
      if (rowRegion && viewerRegion && rowRegion === viewerRegion) {
        out.push(mapDoc(row));
      }
      continue;
    }
    if (row.scope === 'point') {
      const coords = row.geo?.coordinates;
      if (!coords || coords.length < 2) continue;
      const [lng, lat] = coords;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;
      const radius = row.radiusMeters && row.radiusMeters > 0 ? row.radiusMeters : maxM;
      const d = haversineMeters(viewer, { lat, lng });
      if (d <= radius) {
        out.push(mapDoc(row));
      }
    }
  }

  const seen = new Set<string>();
  const deduped: PublicActiveAlertDTO[] = [];
  for (const item of out) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
    if (deduped.length >= 8) break;
  }
  return deduped;
};
