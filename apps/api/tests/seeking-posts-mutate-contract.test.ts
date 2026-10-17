/**
 * PATCH/cancel on `/me/seeking-posts` — activity-backed only (no participant_intents mutation).
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
import { ActivityStatus } from '../src/domain/enums.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('PATCH /me/seeking-posts/:postId', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  it('updates seeking activity without writing participant_intents', async () => {
    const suffix = `seeking-patch-${Date.now()}`;
    const visitor = await registerVerifiedVisitor(app, suffix);

    const createRes = await request(app)
      .post('/api/me/seeking-posts')
      .set('Authorization', `Bearer ${visitor.accessToken}`)
      .send(
        buildTestParticipantIntentInput({
          title: `Before ${suffix}`,
          date: '2026-12-25',
          time: '06:00',
          comment: 'Original comment for patch test.',
        })
      );
    expect(createRes.status).toBe(201);
    const postId = createRes.body.data.id as string;
    const activityId =
      createRes.body.data.activityId ?? createRes.body.data.seekingActivityId;

    const patchRes = await request(app)
      .patch(`/api/me/seeking-posts/${postId}`)
      .set('Authorization', `Bearer ${visitor.accessToken}`)
      .send({ title: `After ${suffix}`, comment: 'Updated comment for patch test.' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.title).toBe(`After ${suffix}`);

    const intentDoc = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.PARTICIPANT_INTENTS)
      .findOne({ _id: postId });
    expect(intentDoc).toBeNull();

    const activity = await findActivityDocInMongo(activityId as string);
    expect(activity?.title).toBe(`After ${suffix}`);
    expect(activity?.description).toContain('Updated comment');
  });
});

describe('POST /me/seeking-posts/:postId/cancel', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  it('cancels seeking activity without participant_intents row', async () => {
    const suffix = `seeking-cancel-${Date.now()}`;
    const visitor = await registerVerifiedVisitor(app, suffix);

    const createRes = await request(app)
      .post('/api/me/seeking-posts')
      .set('Authorization', `Bearer ${visitor.accessToken}`)
      .send(
        buildTestParticipantIntentInput({
          title: `Cancel me ${suffix}`,
          date: '2026-12-26',
          comment: 'Will cancel via seeking-posts route.',
        })
      );
    expect(createRes.status).toBe(201);
    const postId = createRes.body.data.id as string;
    const activityId =
      createRes.body.data.activityId ?? createRes.body.data.seekingActivityId;

    const cancelRes = await request(app)
      .post(`/api/me/seeking-posts/${postId}/cancel`)
      .set('Authorization', `Bearer ${visitor.accessToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');

    const activity = await findActivityDocInMongo(activityId as string);
    expect(activity?.status).toBe(ActivityStatus.CANCELLED);
  });
});
