/**
 * Find FAB wire: POST /me/participant-intents with stub write off → seeking activity only.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { cleanupTestUsers, registerVerifiedVisitor } from './helpers/fixtures.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { findActivityDocInMongo, findLocationInMongo } from '../src/lib/entity-sync.js';
import { buildTestParticipantIntentInput, ensureCuratedAreasSeeded, testAreas } from './helpers/test-seed.js';

const ENV_KEY = 'PARTICIPANT_INTENT_STUB_WRITE';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('POST /me/participant-intents (activity-canonical — stub write off)', () => {
  afterEach(async () => {
    delete process.env[ENV_KEY];
    await cleanupTestUsers();
  });

  it('returns 201 with activityId and does not persist participant_intents', async () => {
    delete process.env[ENV_KEY];
    const suffix = `route-primary-${Date.now()}`;
    const visitor = await registerVerifiedVisitor(app, suffix);

    const body = buildTestParticipantIntentInput({
      title: `Find via API ${suffix}`,
      date: '2026-12-23',
      time: '07:30',
      comment: 'Looking for company on the trail today.',
    });

    const res = await request(app)
      .post('/api/me/participant-intents')
      .set('Authorization', `Bearer ${visitor.accessToken}`)
      .send(body);

    expect(res.status).toBe(201);
    const data = res.body.data as {
      id: string;
      activityId?: string | null;
      seekingActivityId?: string | null;
    };
    expect(data.id).toBeTruthy();
    const activityId = data.activityId ?? data.seekingActivityId;
    expect(activityId).toBeTruthy();

    const intentDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: data.id });
    expect(intentDoc).toBeNull();

    const activity = await findActivityDocInMongo(activityId as string);
    expect(activity?.activityMode).toBe('seeking');
    expect(activity?.participantIntentId).toBe(data.id);
    expect(activity?.status).toBe('PUBLISHED');
    expect(activity?.areaId ?? null).toBeNull();
    const location = activity?.locationId
      ? await findLocationInMongo(activity.locationId)
      : null;
    expect(location?.areaId).toBe(testAreas.hatta.id);
  });
});
