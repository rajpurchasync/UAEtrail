/**
 * Canonical BWL: POST /me/seeking-posts → seeking activity only (MIG-COH-01).
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { cleanupTestUsers, registerVerifiedVisitor } from './helpers/fixtures.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { findActivityDocInMongo } from '../src/lib/entity-sync.js';
import { buildTestParticipantIntentInput, ensureCuratedAreasSeeded } from './helpers/test-seed.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('POST /me/seeking-posts (canonical)', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  it('returns 201 with activityId and does not persist participant_intents', async () => {
    const suffix = `seeking-posts-${Date.now()}`;
    const visitor = await registerVerifiedVisitor(app, suffix);

    const body = buildTestParticipantIntentInput({
      title: `Find via seeking-posts ${suffix}`,
      date: '2026-12-24',
      time: '07:00',
      comment: 'Looking for company.',
    });

    const res = await request(app)
      .post('/api/me/seeking-posts')
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
  });
});
