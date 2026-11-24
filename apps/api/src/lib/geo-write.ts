import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import {
  deltaFor,
  mapFacilityKindToPlanType,
  type GeoCountedPin,
  type GeoDelta,
  type GeoRef,
} from '@uaetrail/shared-types';
import { ActivityStatus, LocationStatus } from '../domain/enums.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { resolveGeoRefForPin } from './geo-resolve.js';
import type { Location } from '../domain/types.js';
import type { MongoActivityDoc } from './entity-builders.js';
import type { Facility } from '../domain/facility.js';

type GeoOutboxRow = {
  _id: string;
  scope: string;
  inc: Record<string, number>;
  at: Date;
  batch?: string;
};

const outbox = (): Collection<GeoOutboxRow> =>
  getMongoClient()!.db().collection<GeoOutboxRow>(COLLECTIONS.GEO_OUTBOX);

const placeKind = (activityType?: string | null): 'trail' | 'camp_spot' | 'facility' => {
  if (activityType === 'camping' || activityType === 'CAMPING') return 'camp_spot';
  if (activityType === 'hiking' || activityType === 'HIKING') return 'trail';
  return 'trail';
};

export const locationIsCounted = (status?: string | null): boolean =>
  status === LocationStatus.ACTIVE || status === 'active' || status === 'ACTIVE';

export const activityIsCounted = (doc: {
  status?: string | null;
  endAt?: Date | null;
  startAt?: Date | null;
}): boolean => {
  const published = doc.status === ActivityStatus.PUBLISHED || doc.status === 'published' || doc.status === 'PUBLISHED';
  if (!published) return false;
  const until = doc.endAt ?? (doc.startAt ? new Date(doc.startAt.getTime() + 12 * 60 * 60 * 1000) : null);
  if (!until) return true;
  return until.getTime() > Date.now();
};

export const locationToCountedPin = (
  loc: Pick<Location, 'activityType' | 'status' | 'geoRef'> & { geoRef?: GeoRef | null }
): GeoCountedPin | null => {
  if (!loc.geoRef) return null;
  return {
    family: 'place',
    kind: placeKind(String(loc.activityType ?? '')),
    geoRef: loc.geoRef,
    counted: locationIsCounted(String(loc.status ?? '')),
  };
};

export const activityToCountedPin = (doc: MongoActivityDoc): GeoCountedPin | null => {
  if (!doc.geoRef) return null;
  return {
    family: 'activity',
    type: String(doc.activityType ?? 'event').toLowerCase(),
    geoRef: doc.geoRef,
    placeId: doc.locationId,
    counted: activityIsCounted(doc),
  };
};

export const facilityToCountedPin = (
  fac: Pick<Facility, 'facilityKind' | 'status' | 'geoRef' | 'onSiteId'>
): GeoCountedPin | null => {
  if (!fac.geoRef) return null;
  return {
    family: 'place',
    kind: 'facility',
    facilityType: mapFacilityKindToPlanType(fac.facilityKind) ?? fac.facilityKind,
    geoRef: fac.geoRef,
    attachedTo: fac.onSiteId ? [{ id: fac.onSiteId }] : undefined,
    counted: locationIsCounted(String(fac.status ?? '')),
  };
};

export const emitGeoDelta = async (delta: GeoDelta, at = new Date()): Promise<void> => {
  const rows = [...delta].map(([scope, inc]) => ({
    _id: randomUUID(),
    scope,
    inc,
    at,
  }));
  if (rows.length === 0) return;
  await outbox().insertMany(rows, { ordered: false });
};

export const emitGeoPinChange = async (
  before: GeoCountedPin | null,
  after: GeoCountedPin | null
): Promise<void> => {
  await emitGeoDelta(deltaFor(before, after));
};

export const attachGeoRefToLocation = async (
  location: Location
): Promise<{ geoRef: GeoRef; needsReview: boolean }> => {
  const resolved = await resolveGeoRefForPin({
    latitude: location.latitude,
    longitude: location.longitude,
    destinationId: location.destinationId,
    countryCode: location.countryCode,
    region: location.region,
    venueName: location.name,
    extraNames: [location.areaLabel, location.name].filter(Boolean) as string[],
  });
  location.geoRef = resolved.geoRef;
  return resolved;
};

export const attachGeoRefToActivity = async (
  doc: MongoActivityDoc,
  location?: (Pick<Location, 'latitude' | 'longitude'> &
    Partial<Pick<Location, 'name' | 'destinationId' | 'region' | 'countryCode'>>) | null
): Promise<GeoRef> => {
  const resolved = await resolveGeoRefForPin({
    latitude: doc.meetingLat ?? doc.startLat ?? location?.latitude ?? null,
    longitude: doc.meetingLng ?? doc.startLng ?? location?.longitude ?? null,
    destinationId: doc.destinationId ?? location?.destinationId,
    countryCode: location?.countryCode ?? 'AE',
    region: location?.region ?? null,
    venueName: location?.name ?? doc.meetingPoint,
    extraNames: [doc.title, doc.meetingPoint, location?.name].filter(Boolean) as string[],
  });
  doc.geoRef = resolved.geoRef;
  if (resolved.needsReview) {
    const needs = new Set(doc.needsReview ?? []);
    needs.add('geoRef');
    doc.needsReview = [...needs];
  }
  return resolved.geoRef;
};
