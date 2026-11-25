import {
  ActivityStatus,
  ActivityType as ActivityTypeEnum,
  LocationStatus,
} from '../domain/enums.js';
import type { Collection } from 'mongodb';
import type { MongoActivityDoc } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { registryCoverImageMongoFilter } from './catalog-registry-cover.js';

const activitiesCollection = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

type PlaceDoc = {
  _id: string;
  name?: string | null;
  region?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  destinationId?: string | null;
  activityType?: string | null;
  status?: string;
  submittedById?: string | null;
};

const placesCollection = (): Collection<PlaceDoc> =>
  getMongoClient()!.db().collection<PlaceDoc>('locations');

export type RideshareDestinationSearchRow = {
  kind: 'activity_meeting' | 'catalog_place' | 'pending_place';
  id: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
  activityType?: string;
  pendingApproval?: boolean;
  /** Catalog trail/spot name when destination is an outing meeting point. */
  placeName?: string;
};

const PUBLIC_CACHE_MS = 20_000;
const PUBLIC_CACHE_MAX = 80;
const publicCache = new Map<string, { at: number; rows: RideshareDestinationSearchRow[] }>();

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsRegex = (query: string): RegExp =>
  new RegExp(escapeRegex(query.trim()), 'i');

const isRideshareType = (activityType: string | null | undefined): boolean =>
  String(activityType ?? '').toUpperCase() === ActivityTypeEnum.RIDESHARE;

const rememberPublic = (key: string, rows: RideshareDestinationSearchRow[]): void => {
  publicCache.set(key, { at: Date.now(), rows });
  if (publicCache.size <= PUBLIC_CACHE_MAX) return;
  const oldest = publicCache.keys().next().value;
  if (oldest) publicCache.delete(oldest);
};

const readPublicCache = (key: string): RideshareDestinationSearchRow[] | null => {
  const hit = publicCache.get(key);
  if (!hit || Date.now() - hit.at > PUBLIC_CACHE_MS) return null;
  return hit.rows;
};

const searchActivityMeetings = async (
  regex: RegExp
): Promise<RideshareDestinationSearchRow[]> => {
  const namedPlaces = await placesCollection()
    .find({ status: LocationStatus.ACTIVE, name: regex }, { projection: { _id: 1, name: 1 } })
    .limit(20)
    .toArray();
  const placeNameById = new Map(
    namedPlaces.map((place) => [String(place._id), place.name?.trim() ?? ''])
  );

  const textMatch: Record<string, unknown>[] = [{ title: regex }, { meetingPoint: regex }];
  if (namedPlaces.length > 0) {
    textMatch.push({ locationId: { $in: namedPlaces.map((place) => String(place._id)) } });
  }

  const docs = await activitiesCollection()
    .find(
      {
        status: ActivityStatus.PUBLISHED,
        activityType: { $ne: ActivityTypeEnum.RIDESHARE },
        meetingLat: { $gte: -90, $lte: 90 },
        meetingLng: { $gte: -180, $lte: 180 },
        title: { $gt: '' },
        $or: textMatch,
      },
      {
        projection: {
          title: 1,
          meetingPoint: 1,
          meetingLat: 1,
          meetingLng: 1,
          locationId: 1,
          activityType: 1,
        },
      }
    )
    .sort({ startAt: -1 })
    .limit(12)
    .toArray();

  const missingLocationIds = [
    ...new Set(
      docs
        .map((doc) => (doc.locationId ? String(doc.locationId) : ''))
        .filter((id) => id && !placeNameById.has(id))
    ),
  ];
  if (missingLocationIds.length > 0) {
    const linked = await placesCollection()
      .find({ _id: { $in: missingLocationIds } }, { projection: { name: 1 } })
      .toArray();
    for (const place of linked) {
      const name = place.name?.trim();
      if (name) placeNameById.set(String(place._id), name);
    }
  }

  const rows: RideshareDestinationSearchRow[] = [];
  for (const doc of docs) {
    const title = String(doc.title ?? '').trim();
    const meeting = String(doc.meetingPoint ?? '').trim();
    const placeName = doc.locationId ? placeNameById.get(String(doc.locationId)) ?? '' : '';
    const secondaryText = placeName || meeting;
    if (!title || !secondaryText) continue;
    if (typeof doc.meetingLat !== 'number' || typeof doc.meetingLng !== 'number') continue;
    rows.push({
      kind: 'activity_meeting',
      id: String(doc._id),
      mainText: title,
      placeName: placeName || undefined,
      secondaryText,
      lat: doc.meetingLat,
      lng: doc.meetingLng,
      activityType: String(doc.activityType ?? '').toLowerCase(),
    });
  }
  return rows;
};

const searchCatalogPlaces = async (regex: RegExp): Promise<RideshareDestinationSearchRow[]> => {
  const places = await placesCollection()
    .find(
      {
        status: LocationStatus.ACTIVE,
        registryListed: { $ne: false },
        ...registryCoverImageMongoFilter(),
        destinationId: { $gt: '' },
        latitude: { $gte: -90, $lte: 90 },
        longitude: { $gte: -180, $lte: 180 },
        name: { $gt: '' },
        $or: [{ name: regex }, { region: regex }, { countryCode: regex }],
      },
      {
        projection: {
          name: 1,
          region: 1,
          countryCode: 1,
          latitude: 1,
          longitude: 1,
          activityType: 1,
        },
      }
    )
    .limit(8)
    .toArray();

  const rows: RideshareDestinationSearchRow[] = [];
  for (const place of places) {
    if (isRideshareType(place.activityType)) continue;
    const name = place.name?.trim() ?? '';
    const region = place.region?.trim() || place.countryCode?.trim() || '';
    if (!name || !region) continue;
    if (typeof place.latitude !== 'number' || typeof place.longitude !== 'number') continue;
    rows.push({
      kind: 'catalog_place',
      id: String(place._id),
      mainText: name,
      secondaryText: region,
      lat: place.latitude,
      lng: place.longitude,
      activityType: String(place.activityType ?? '').toLowerCase(),
    });
  }
  return rows;
};

const searchPendingPlaces = async (
  regex: RegExp,
  userId: string
): Promise<RideshareDestinationSearchRow[]> => {
  const places = await placesCollection()
    .find(
      {
        submittedById: userId,
        status: LocationStatus.DRAFT,
        name: regex,
        latitude: { $gte: -90, $lte: 90 },
        longitude: { $gte: -180, $lte: 180 },
      },
      { projection: { name: 1, latitude: 1, longitude: 1, activityType: 1 } }
    )
    .limit(6)
    .toArray();

  const rows: RideshareDestinationSearchRow[] = [];
  for (const place of places) {
    const name = place.name?.trim() ?? '';
    if (!name) continue;
    if (typeof place.latitude !== 'number' || typeof place.longitude !== 'number') continue;
    rows.push({
      kind: 'pending_place',
      id: String(place._id),
      mainText: name,
      secondaryText: 'Waiting for approval',
      lat: place.latitude,
      lng: place.longitude,
      activityType: String(place.activityType ?? '').toLowerCase(),
      pendingApproval: true,
    });
  }
  return rows;
};

const mergeRows = (
  groups: RideshareDestinationSearchRow[][]
): RideshareDestinationSearchRow[] => {
  const deduped: RideshareDestinationSearchRow[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const row of group) {
      const key = `${row.kind}:${row.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(row);
      if (deduped.length >= 14) return deduped;
    }
  }
  return deduped;
};

export const searchRideshareDestinations = async (
  query: string,
  userId?: string | null
): Promise<RideshareDestinationSearchRow[]> => {
  const q = query.trim();
  if (q.length < 2) return [];
  const regex = containsRegex(q);
  const cacheKey = q.toLowerCase();
  const cached = readPublicCache(cacheKey);
  const publicRows =
    cached ??
    (await (async () => {
      const [activities, places] = await Promise.all([
        searchActivityMeetings(regex),
        searchCatalogPlaces(regex),
      ]);
      const rows = mergeRows([activities, places]);
      rememberPublic(cacheKey, rows);
      return rows;
    })());
  if (!userId) return publicRows;
  const pending = await searchPendingPlaces(regex, userId);
  return mergeRows([publicRows, pending]);
};

const activityMeetingRow = async (
  id: string
): Promise<RideshareDestinationSearchRow | null> => {
  const doc = await activitiesCollection().findOne(
    {
      _id: id,
      status: ActivityStatus.PUBLISHED,
      activityType: { $ne: ActivityTypeEnum.RIDESHARE },
      meetingLat: { $gte: -90, $lte: 90 },
      meetingLng: { $gte: -180, $lte: 180 },
    },
    {
      projection: {
        title: 1,
        meetingPoint: 1,
        meetingLat: 1,
        meetingLng: 1,
        locationId: 1,
        activityType: 1,
      },
    }
  );
  if (!doc || typeof doc.meetingLat !== 'number' || typeof doc.meetingLng !== 'number') return null;
  const title = String(doc.title ?? '').trim();
  const meeting = String(doc.meetingPoint ?? '').trim();
  let placeName = '';
  if (doc.locationId) {
    const linked = await placesCollection().findOne(
      { _id: String(doc.locationId) },
      { projection: { name: 1 } }
    );
    placeName = linked?.name?.trim() ?? '';
  }
  const secondaryText = placeName || meeting;
  if (!title || !secondaryText) return null;
  return {
    kind: 'activity_meeting',
    id,
    mainText: title,
    placeName: placeName || undefined,
    secondaryText,
    lat: doc.meetingLat,
    lng: doc.meetingLng,
    activityType: String(doc.activityType ?? '').toLowerCase(),
  };
};

const catalogPlaceRow = async (id: string): Promise<RideshareDestinationSearchRow | null> => {
  const place = await placesCollection().findOne({
    _id: id,
    status: LocationStatus.ACTIVE,
    destinationId: { $gt: '' },
    latitude: { $gte: -90, $lte: 90 },
    longitude: { $gte: -180, $lte: 180 },
  });
  if (!place || isRideshareType(place.activityType)) return null;
  const name = place.name?.trim() ?? '';
  const region = place.region?.trim() || place.countryCode?.trim() || '';
  if (!name || !region || typeof place.latitude !== 'number' || typeof place.longitude !== 'number') {
    return null;
  }
  return {
    kind: 'catalog_place',
    id,
    mainText: name,
    secondaryText: region,
    lat: place.latitude,
    lng: place.longitude,
    activityType: String(place.activityType ?? '').toLowerCase(),
  };
};

const pendingPlaceRow = async (
  id: string,
  userId: string
): Promise<RideshareDestinationSearchRow | null> => {
  const place = await placesCollection().findOne({
    _id: id,
    submittedById: userId,
    status: LocationStatus.DRAFT,
    latitude: { $gte: -90, $lte: 90 },
    longitude: { $gte: -180, $lte: 180 },
  });
  if (!place || typeof place.latitude !== 'number' || typeof place.longitude !== 'number') return null;
  const name = place.name?.trim() ?? '';
  if (!name) return null;
  return {
    kind: 'pending_place',
    id,
    mainText: name,
    secondaryText: 'Waiting for approval',
    lat: place.latitude,
    lng: place.longitude,
    activityType: String(place.activityType ?? '').toLowerCase(),
    pendingApproval: true,
  };
};

export const resolveRideshareDestinationRow = async (
  kind: RideshareDestinationSearchRow['kind'],
  id: string,
  userId?: string | null
): Promise<RideshareDestinationSearchRow | null> => {
  if (kind === 'activity_meeting') return activityMeetingRow(id);
  if (kind === 'catalog_place') return catalogPlaceRow(id);
  if (kind === 'pending_place' && userId) return pendingPlaceRow(id, userId);
  return null;
};
