import { describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  buildTrackPreviewFromGpxPoints,
  encodeGooglePolyline,
  parseGpxTrackPoints,
} from '../src/lib/gpx-track-preview.js';
import { upsertPlaceTrackForLocation } from '../src/lib/place-heavy-store.js';
import { connectMongo, getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { configureTestEnv } from './helpers/bootstrap.js';

const gpxFixture = `<?xml version="1.0"?>
<gpx>
  <trk>
    <trkseg>
      <trkpt lat="25.10" lon="55.20"><ele>100</ele></trkpt>
      <trkpt lat="25.11" lon="55.21"><ele>350</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe('gpx-track-preview', () => {
  it('parses trkpt and builds bbox, polyline, profile', () => {
    const points = parseGpxTrackPoints(gpxFixture);
    expect(points).toHaveLength(2);
    const preview = buildTrackPreviewFromGpxPoints(points);
    expect(preview).not.toBeNull();
    expect(preview!.bbox).toEqual([55.2, 25.1, 55.21, 25.11]);
    expect(preview!.polyline.length).toBeGreaterThan(0);
    expect(preview!.profile.length).toBeGreaterThanOrEqual(2);
  });

  it('encodeGooglePolyline roundtrips sample path length', () => {
    const path: [number, number][] = [
      [38.5, -120.2],
      [40.7, -120.95],
    ];
    const enc = encodeGooglePolyline(path, 5);
    expect(enc.length).toBeGreaterThan(0);
  });
});

describe('upsertPlaceTrackForLocation GPX ingestion', () => {
  it('stores bbox and polyline from local uploads GPX file', async () => {
    configureTestEnv();
    await connectMongo();
    const placeId = randomUUID();
    const relKey = `locations/contract-${placeId}.gpx`;
    const fullPath = join(process.cwd(), 'uploads', relKey);
    await mkdir(join(process.cwd(), 'uploads', 'locations'), { recursive: true });
    await writeFile(fullPath, gpxFixture, 'utf8');

    await upsertPlaceTrackForLocation({ placeId, gpxKey: relKey });

    const doc = await getMongoClient()!.db().collection(COLLECTIONS.PLACE_TRACKS).findOne({ _id: placeId });
    expect(doc?.gpxKey).toBe(relKey);
    expect(doc?.bbox).toEqual([55.2, 25.1, 55.21, 25.11]);
    expect(typeof doc?.polyline).toBe('string');
    expect((doc?.polyline as string).length).toBeGreaterThan(0);
    expect(Array.isArray(doc?.profile)).toBe(true);
    expect((doc?.profile as [number, number][]).length).toBeGreaterThanOrEqual(2);
  });
});
