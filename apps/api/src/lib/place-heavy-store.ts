/**
 * Heavy place payloads (plan §13.5) — `place_tracks` and `place_guides` keyed by location id.
 * Parent `locations` documents omit `gpxKey` / `guideMarkdown` after migration; readers merge via {@link mergeLocationWithHeavyDocs}.
 */
import type { Collection, Document } from 'mongodb';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';
import type { Location } from '../domain/types.js';
import { loadTrackPreviewFieldsFromGpxKey } from './gpx-track-preview.js';

export type MongoPlaceTrackDoc = {
  _id: string;
  gpxKey?: string | null;
  bbox?: [number, number, number, number];
  polyline?: string;
  profile?: [number, number][];
  updatedAt: Date;
};

export type MongoPlaceGuideDoc = {
  _id: string;
  markdown: string;
  updatedAt: Date;
};

const placeTracksCollection = (): Collection<MongoPlaceTrackDoc> =>
  getMongoClient()!.db().collection<MongoPlaceTrackDoc>(COLLECTIONS.PLACE_TRACKS);

const placeGuidesCollection = (): Collection<MongoPlaceGuideDoc> =>
  getMongoClient()!.db().collection<MongoPlaceGuideDoc>(COLLECTIONS.PLACE_GUIDES);

export const upsertPlaceTrackForLocation = async (input: {
  placeId: string;
  gpxKey: string | null;
}): Promise<void> => {
  const now = new Date();
  if (!input.gpxKey?.trim()) {
    await placeTracksCollection().deleteOne({ _id: input.placeId });
    return;
  }
  const key = input.gpxKey.trim();
  const preview = await loadTrackPreviewFieldsFromGpxKey(key);
  const $set: Record<string, unknown> = { gpxKey: key, updatedAt: now };
  if (preview) {
    $set.bbox = preview.bbox;
    $set.polyline = preview.polyline;
    $set.profile = preview.profile.length >= 2 ? preview.profile : [];
  } else {
    $set.bbox = null;
    $set.polyline = null;
    $set.profile = [];
  }
  await placeTracksCollection().updateOne({ _id: input.placeId }, { $set }, { upsert: true });
};

export const upsertPlaceGuideForLocation = async (input: {
  placeId: string;
  markdown: string | null;
}): Promise<void> => {
  const now = new Date();
  const md = input.markdown?.trim();
  if (!md) {
    await placeGuidesCollection().deleteOne({ _id: input.placeId });
    return;
  }
  await placeGuidesCollection().updateOne(
    { _id: input.placeId },
    { $set: { markdown: md, updatedAt: now } },
    { upsert: true }
  );
};

export const persistPlaceHeavyFieldsFromLocationWrite = async (input: {
  placeId: string;
  gpxKey: string | null;
  guideMarkdown: string | null;
}): Promise<void> => {
  await Promise.all([
    upsertPlaceTrackForLocation({ placeId: input.placeId, gpxKey: input.gpxKey }),
    upsertPlaceGuideForLocation({ placeId: input.placeId, markdown: input.guideMarkdown }),
  ]);
};

export const mergeLocationWithHeavyDocs = (
  loc: Location,
  track: Pick<MongoPlaceTrackDoc, 'gpxKey'> | null | undefined,
  guide: Pick<MongoPlaceGuideDoc, 'markdown'> | null | undefined
): Location => ({
  ...loc,
  gpxKey: loc.gpxKey ?? track?.gpxKey ?? null,
  guideMarkdown: loc.guideMarkdown ?? guide?.markdown ?? null,
});

export const findPlaceTrackById = async (placeId: string): Promise<MongoPlaceTrackDoc | null> =>
  placeTracksCollection().findOne({ _id: placeId });

export const findPlaceGuideById = async (placeId: string): Promise<MongoPlaceGuideDoc | null> =>
  placeGuidesCollection().findOne({ _id: placeId });

export const enrichLocationWithHeavyReads = async (loc: Location): Promise<Location> => {
  const [track, guide] = await Promise.all([findPlaceTrackById(loc.id), findPlaceGuideById(loc.id)]);
  return mergeLocationWithHeavyDocs(loc, track, guide);
};

export const enrichLocationsWithHeavyReadsBatch = async (locs: Location[]): Promise<Location[]> => {
  if (locs.length === 0) return locs;
  const ids = locs.map((l) => l.id);
  const db = getMongoClient()!.db();
  const [tracks, guides] = await Promise.all([
    db.collection<MongoPlaceTrackDoc>(COLLECTIONS.PLACE_TRACKS).find({ _id: { $in: ids } }).toArray(),
    db.collection<MongoPlaceGuideDoc>(COLLECTIONS.PLACE_GUIDES).find({ _id: { $in: ids } }).toArray(),
  ]);
  const trackMap = new Map(tracks.map((t) => [t._id, t]));
  const guideMap = new Map(guides.map((g) => [g._id, g]));
  return locs.map((loc) =>
    mergeLocationWithHeavyDocs(loc, trackMap.get(loc.id), guideMap.get(loc.id))
  );
};

/** Strip heavy fields from the BSON written to `locations` (kept in side collections). */
export const stripHeavyFieldsFromLocationMongoDoc = <T extends Document>(doc: T): T => {
  const next = { ...doc } as T & { gpxKey?: unknown; guideMarkdown?: unknown };
  next.gpxKey = null;
  next.guideMarkdown = null;
  return next as T;
};
