import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import {
  buildDedupeKeys,
  scoreDuplicate,
  trigramRatio,
  type DedupeKind,
  type FacilityType,
  type GeoPointWire,
  type SubmissionCandidate,
  type SubmissionDoc,
  type SubmissionStatus,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { distanceKm } from './geo-distance.js';
import { resolveGeoRefForPin } from './geo-resolve.js';
import { attachGeoRefToLocation, emitGeoPinChange, facilityToCountedPin, locationToCountedPin } from './geo-write.js';
import { writeLocationToMongo } from './entity-sync.js';
import { createFacilityRecord } from './facilities-store.js';
import { LocationStatus } from '../domain/enums.js';
import { newEntityId } from './entity-builders.js';
import { ApiError } from './api-error.js';
import { bumpGeoTreeVersion } from './geo-tree.js';
import { seedGeoNodesFromCatalog } from './geo-backfill.js';

const col = (): Collection<SubmissionDoc> =>
  getMongoClient()!.db().collection<SubmissionDoc>(COLLECTIONS.SUBMISSIONS);

const places = () => getMongoClient()!.db().collection(COLLECTIONS.LOCATIONS);
const facilities = () => getMongoClient()!.db().collection(COLLECTIONS.FACILITIES);

const ALWAYS_REVIEW = process.env.SUBMISSION_AMENITY_AUTO_APPROVE?.trim() === '1' ? false : true;

export const amenityAutoApproveEnabled = (): boolean => !ALWAYS_REVIEW;

const toPoint = (lat: number, lng: number): GeoPointWire => ({
  type: 'Point',
  coordinates: [lng, lat],
});

export const findSubmissionCandidates = async (input: {
  kind: DedupeKind;
  facilityType?: FacilityType;
  latitude: number;
  longitude: number;
  name?: string;
  phone?: string;
  website?: string;
}): Promise<SubmissionCandidate[]> => {
  const geo = toPoint(input.latitude, input.longitude);
  const keys = buildDedupeKeys({
    name: input.name ?? '',
    geo,
    kind: input.kind,
  });
  const cells = keys.cells;
  const name = input.name ? keys.nameKey : '';

  const kindFilter =
    input.kind === 'trail'
      ? { activityType: { $in: ['hiking', 'HIKING'] } }
      : input.kind === 'camp_spot'
        ? { activityType: { $in: ['camping', 'CAMPING'] } }
        : {};

  const phone = typeof (input as { phone?: string }).phone === 'string' ? (input as { phone?: string }).phone : undefined;
  const website = typeof (input as { website?: string }).website === 'string' ? (input as { website?: string }).website : undefined;
  const keysWithContact = buildDedupeKeys({
    name: input.name ?? '',
    geo,
    kind: input.kind,
    phone: phone ?? null,
    website: website ?? null,
  });

  const [livePlaces, liveFacs, pending, byPhone, byDomain] = await Promise.all([
    input.kind === 'facility'
      ? Promise.resolve([])
      : places()
          .find({ 'dedupe.cells': { $in: cells }, ...kindFilter })
          .project({ name: 1, latitude: 1, longitude: 1, 'dedupe.nameKey': 1, 'dedupe.routeKey': 1, 'dedupe.phoneKey': 1, 'dedupe.domainKey': 1 })
          .limit(50)
          .toArray(),
    input.kind === 'facility'
      ? facilities()
          .find({
            'dedupe.cells': { $in: cells },
            ...(input.facilityType ? { facilityKind: input.facilityType } : {}),
          })
          .project({ name: 1, latitude: 1, longitude: 1, 'dedupe.nameKey': 1, 'dedupe.phoneKey': 1, 'dedupe.domainKey': 1 })
          .limit(50)
          .toArray()
      : Promise.resolve([]),
    col()
      .find({ 'dedupe.cells': { $in: cells }, status: 'pending', kind: input.kind })
      .project({ payload: 1, geo: 1, dedupe: 1 })
      .limit(20)
      .toArray(),
    keysWithContact.phoneKey
      ? facilities().find({ 'dedupe.phoneKey': keysWithContact.phoneKey }).project({ name: 1, latitude: 1, longitude: 1, dedupe: 1 }).limit(10).toArray()
      : Promise.resolve([]),
    keysWithContact.domainKey
      ? facilities().find({ 'dedupe.domainKey': keysWithContact.domainKey }).project({ name: 1, latitude: 1, longitude: 1, dedupe: 1 }).limit(10).toArray()
      : Promise.resolve([]),
  ]);

  const scored: Array<SubmissionCandidate & { confidence: number }> = [];
  const pushLive = (row: {
    _id: unknown;
    name?: string;
    latitude?: number;
    longitude?: number;
    dedupe?: { nameKey?: string; routeKey?: string; phoneKey?: string; domainKey?: string };
  }, source: 'live') => {
    if (row.latitude == null || row.longitude == null) return;
    const distanceM = distanceKm(input.latitude, input.longitude, row.latitude, row.longitude) * 1000;
    const nameScore = name ? trigramRatio(name, row.dedupe?.nameKey ?? '') : 0;
    const samePhoneOrDomain = Boolean(
      (keysWithContact.phoneKey && row.dedupe?.phoneKey === keysWithContact.phoneKey) ||
        (keysWithContact.domainKey && row.dedupe?.domainKey === keysWithContact.domainKey)
    );
    const { verdict, confidence } = scoreDuplicate({
      kind: input.kind,
      distanceM,
      nameScore,
      samePhoneOrDomain,
      hasRouteKey: Boolean(row.dedupe?.routeKey),
    });
    if (verdict === 'no') return;
    scored.push({
      id: String(row._id),
      source,
      distanceM: Math.round(distanceM),
      nameScore,
      verdict,
      name: row.name,
      confidence,
    });
  };

  const seenIds = new Set<string>();
  for (const row of [...livePlaces, ...liveFacs, ...byPhone, ...byDomain]) {
    const id = String((row as { _id: unknown })._id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    pushLive(row as never, 'live');
  }
  for (const row of pending) {
    const [lng, lat] = row.geo.coordinates;
    const distanceM = distanceKm(input.latitude, input.longitude, lat, lng) * 1000;
    const nameScore = name ? trigramRatio(name, row.dedupe.nameKey) : 0;
    const { verdict, confidence } = scoreDuplicate({
      kind: input.kind,
      distanceM,
      nameScore,
    });
    if (verdict === 'no') continue;
    scored.push({
      id: String(row._id),
      source: 'pending',
      distanceM: Math.round(distanceM),
      nameScore,
      verdict,
      name: typeof row.payload?.name === 'string' ? row.payload.name : undefined,
      confidence,
    });
  }

  scored.sort((a, b) => b.confidence - a.confidence);
  return scored.slice(0, 5).map(({ confidence: _c, ...rest }) => rest);
};

export const createSubmission = async (input: {
  userId: string;
  kind: DedupeKind;
  facilityType?: FacilityType;
  latitude: number;
  longitude: number;
  name: string;
  payload: Record<string, unknown>;
  candidates: SubmissionCandidate[];
  insisted?: { reason: string; note?: string };
}): Promise<SubmissionDoc> => {
  if (input.candidates.some((c) => c.verdict === 'near_certain') && !input.insisted?.reason?.trim()) {
    throw new ApiError(
      400,
      'insist_required',
      'This looks like an existing place. Add a short reason, or follow the existing suggestion.'
    );
  }
  const geo = toPoint(input.latitude, input.longitude);
  const dedupe = buildDedupeKeys({
    name: input.name,
    geo,
    kind: input.kind,
    phone: typeof input.payload.phone === 'string' ? input.payload.phone : null,
    website: typeof input.payload.website === 'string' ? input.payload.website : null,
  });
  const { geoRef } = await resolveGeoRefForPin({
    latitude: input.latitude,
    longitude: input.longitude,
    areaId: typeof input.payload.areaId === 'string' ? input.payload.areaId : null,
    countryCode: 'AE',
    region: typeof input.payload.region === 'string' ? input.payload.region : null,
    venueName: input.name,
  });
  const now = new Date();
  const doc: SubmissionDoc = {
    _id: randomUUID(),
    kind: input.kind,
    facilityType: input.facilityType,
    status: 'pending',
    payload: { ...input.payload, name: input.name },
    dedupe,
    geo,
    geoRef,
    candidates: input.candidates,
    insisted: input.insisted
      ? { reason: input.insisted.reason, note: input.insisted.note, at: now }
      : undefined,
    submittedBy: input.userId,
    seconded: [],
    photos: Array.isArray(input.payload.photos) ? (input.payload.photos as string[]) : [],
    createdAt: now,
    updatedAt: now,
  };
  try {
    await col().insertOne(doc);
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 11000) {
      throw new ApiError(409, 'submission_duplicate', 'Someone already suggested this pin.');
    }
    throw err;
  }
  return doc;
};

export const secondSubmission = async (id: string, userId: string): Promise<SubmissionDoc | null> => {
  await col().updateOne(
    { _id: id, status: 'pending' },
    { $addToSet: { seconded: userId }, $set: { updatedAt: new Date() } }
  );
  return col().findOne({ _id: id });
};

export const listPendingSubmissions = async (): Promise<SubmissionDoc[]> =>
  col().find({ status: 'pending' }).sort({ createdAt: 1 }).limit(100).toArray();

const materializePlace = async (sub: SubmissionDoc): Promise<string> => {
  const id = newEntityId();
  const [lng, lat] = sub.geo.coordinates;
  const name = String(sub.payload.name ?? 'Untitled');
  const activityType =
    sub.kind === 'camp_spot' ? 'CAMPING' : sub.kind === 'trail' ? 'HIKING' : 'EVENT';
  const location = {
    id,
    name,
    region: String(sub.payload.region ?? sub.geoRef?.names.state ?? 'Dubai'),
    areaLabel: sub.geoRef?.names.area ?? null,
    areaId: sub.geoRef?.areaId || null,
    activityType: activityType as never,
    description: String(sub.payload.description ?? ''),
    difficulty: null,
    season: [],
    childFriendly: false,
    maxGroupSize: null,
    accessibility: null,
    images: sub.photos,
    featured: false,
    status: LocationStatus.ACTIVE,
    distance: null,
    duration: null,
    elevation: null,
    campingType: null,
    latitude: lat,
    longitude: lng,
    highlights: [],
    surfaceType: [],
    tags: [],
    parkingLink: null,
    parkingLat: null,
    parkingLng: null,
    groupRegionLevels: null,
    premiumImages: [],
    accessibleBy: [],
    viewCount: 0,
    countryCode: 'AE',
    gpxKey: null,
    guidePdfKey: null,
    guideMarkdown: null,
    guidePreview: null,
    unlockPriceAed: 0,
    submittedById: sub.submittedBy,
    registeredByUserId: sub.submittedBy,
    registryListed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    geoRef: sub.geoRef,
  };
  await attachGeoRefToLocation(location);
  await writeLocationToMongo(location);
  await getMongoClient()!
    .db()
    .collection<{ _id: string }>(COLLECTIONS.LOCATIONS)
    .updateOne(
      { _id: id },
      { $set: { dedupe: sub.dedupe, aliases: [name] } }
    );
  await emitGeoPinChange(null, locationToCountedPin(location));
  return id;
};

const materializeFacility = async (sub: SubmissionDoc): Promise<string> => {
  const [lng, lat] = sub.geo.coordinates;
  const created = await createFacilityRecord({
    name: String(sub.payload.name ?? 'Facility'),
    region: String(sub.payload.region ?? sub.geoRef?.names.state ?? 'Dubai'),
    areaId: sub.geoRef?.areaId || 'unknown',
    areaLabel: sub.geoRef?.names.area ?? null,
    facilityKind: (sub.facilityType ?? 'toilet') as never,
    parentPlaceId: typeof sub.payload.parentPlaceId === 'string' ? sub.payload.parentPlaceId : null,
    description: String(sub.payload.description ?? ''),
    latitude: lat,
    longitude: lng,
    images: sub.photos,
    tags: [],
    countryCode: 'AE',
    registeredByUserId: sub.submittedBy,
    status: LocationStatus.ACTIVE,
  });
  await getMongoClient()!
    .db()
    .collection<{ _id: string }>(COLLECTIONS.FACILITIES)
    .updateOne(
      { _id: created.id },
      { $set: { geoRef: sub.geoRef, dedupe: sub.dedupe, aliases: [created.name] } }
    );
  await emitGeoPinChange(null, facilityToCountedPin({ ...created, geoRef: sub.geoRef }));
  return created.id;
};

const materializeArea = async (sub: SubmissionDoc): Promise<string> => {
  const db = getMongoClient()!.db();
  const id = randomUUID();
  const name = String(sub.payload.name ?? 'New area');
  const [lng, lat] = sub.geo.coordinates;
  await db.collection(COLLECTIONS.GEO_NODES).insertOne({
    _id: id,
    level: sub.kind === 'venue' ? 4 : 3,
    kind: sub.kind === 'venue' ? 'venue' : 'area',
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id.slice(0, 8),
    path: sub.geoRef?.path ? `${sub.geoRef.path}/${id.slice(0, 8)}` : `ae/new/${id.slice(0, 8)}`,
    names: { en: name },
    parentId: sub.geoRef?.areaId || sub.geoRef?.stateId,
    ancestors: sub.geoRef?.chain ?? [],
    center: sub.geo,
    bbox: [lng - 0.05, lat - 0.05, lng + 0.05, lat + 0.05],
    childCount: 0,
    sort: 50,
    status: 'active',
    dedupe: sub.dedupe,
    aliases: [name],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never);
  await bumpGeoTreeVersion();
  await seedGeoNodesFromCatalog(db);
  return id;
};

export const reviewSubmission = async (input: {
  id: string;
  reviewerId: string;
  action: 'approve' | 'reject' | 'merge';
  reason?: string;
  mergedInto?: string;
}): Promise<SubmissionDoc> => {
  const sub = await col().findOne({ _id: input.id });
  if (!sub || sub.status !== 'pending') {
    throw new ApiError(404, 'submission_not_found', 'Submission not found.');
  }
  let targetId = input.mergedInto;
  if (input.action === 'approve') {
    const { geoRef } = await resolveGeoRefForPin({
      latitude: sub.geo.coordinates[1],
      longitude: sub.geo.coordinates[0],
      venueName: String(sub.payload.name ?? ''),
    });
    sub.geoRef = geoRef;
    if (sub.kind === 'facility') targetId = await materializeFacility(sub);
    else if (sub.kind === 'area' || sub.kind === 'venue') targetId = await materializeArea(sub);
    else targetId = await materializePlace(sub);
  }
  const status: SubmissionStatus =
    input.action === 'approve' ? 'approved' : input.action === 'merge' ? 'merged' : 'rejected';
  const now = new Date();
  await col().updateOne(
    { _id: sub._id },
    {
      $set: {
        status,
        targetId,
        review: {
          by: input.reviewerId,
          at: now,
          action: input.action,
          reason: input.reason,
          mergedInto: input.mergedInto,
        },
        updatedAt: now,
      },
    }
  );
  const next = await col().findOne({ _id: sub._id });
  if (!next) throw new ApiError(500, 'submission_update_failed', 'Could not update submission.');
  return next;
};

export { ALWAYS_REVIEW };
