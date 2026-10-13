/**
 * API slice of PRE_DEPLOY **G-manage**: pending join → Plan "Needs you" signal (`host_join_queue`)
 * → host approves via activity join queue (`PATCH /host/requests/:id`). UI sheet on `/plan` is still manual QA.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import {
  cleanupEventFixture,
  cleanupTestUsers,
  createPublishedEventFixture,
  registerVerifiedVisitor,
  type PublishedEventFixture,
} from './helpers/fixtures.js';

const ORG_PASSWORD = 'TestPass1';

let app: Express;
const suffix = `g-manage-${Date.now()}`;
let fixture: PublishedEventFixture;
let joiner: { email: string; password: string };

beforeAll(async () => {
  app = await bootstrapTestApp();
  fixture = await createPublishedEventFixture(suffix);
  joiner = await registerVerifiedVisitor(app, `${suffix}-joiner`);
});

afterAll(async () => {
  await cleanupEventFixture(fixture);
  await cleanupTestUsers();
});

const loginToken = async (email: string, password: string): Promise<string> => {
  const login = await request(app).post('/api/v1/auth/login').send({ email, password });
  expect(login.status).toBe(200);
  return login.body.tokens.accessToken as string;
};

const completeSignupProfile = async (accessToken: string): Promise<void> => {
  const res = await request(app)
    .patch('/api/v1/me/profile/signup-details')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      dateOfBirth: '1990-01-15',
      gender: 'prefer_not_to_say',
      countryCode: 'AE',
      languages: 'en',
    });
  expect(res.status).toBe(200);
  expect(res.body.data.signupProfileComplete).toBe(true);
};

const hostEmail = () => `org-${suffix}@test.local`;

describe('G-manage coordination + host join approve (API)', () => {
  it('surfaces host_join_queue then clears after approve', async () => {
    const joinerToken = await loginToken(joiner.email, joiner.password);
    const joinRes = await request(app)
      .post(`/api/v1/activities/${fixture.activityId}/requests`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ note: 'G-manage integration' });

    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.status).toBe('pending');
    const requestId = joinRes.body.data.id as string;

    const hostToken = await loginToken(hostEmail(), ORG_PASSWORD);
    await completeSignupProfile(hostToken);

    const attentionBefore = await request(app)
      .get('/api/v1/me/coordination-attention')
      .set('Authorization', `Bearer ${hostToken}`);

    expect(attentionBefore.status).toBe(200);
    const hostQueue = (attentionBefore.body.data.items as { kind: string; count: number }[]).find(
      (row) => row.kind === 'host_join_queue'
    );
    expect(hostQueue?.count).toBeGreaterThanOrEqual(1);

    const queueRes = await request(app)
      .get('/api/v1/operator/requests')
      .set('Authorization', `Bearer ${hostToken}`)
      .set('x-organisation-id', fixture.tenantId)
      .query({ page: 1, pageSize: 20 });

    expect(queueRes.status).toBe(200);
    const pending = (queueRes.body.data as { id: string; status: string }[]).find(
      (row) => row.id === requestId
    );
    expect(pending?.status).toBe('pending');

    const approveRes = await request(app)
      .patch(`/api/v1/operator/requests/${requestId}`)
      .set('Authorization', `Bearer ${hostToken}`)
      .set('x-organisation-id', fixture.tenantId)
      .send({ status: 'approved' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.message).toMatch(/approved/i);

    const attentionAfter = await request(app)
      .get('/api/v1/me/coordination-attention')
      .set('Authorization', `Bearer ${hostToken}`);

    expect(attentionAfter.status).toBe(200);
    const hostQueueAfter = (attentionAfter.body.data.items as { kind: string }[]).some(
      (row) => row.kind === 'host_join_queue'
    );
    expect(hostQueueAfter).toBe(false);

    const joinerMine = await request(app)
      .get('/api/v1/me/requests')
      .set('Authorization', `Bearer ${joinerToken}`);

    expect(joinerMine.status).toBe(200);
    const mineRow = (joinerMine.body.data as { id: string; status: string }[]).find(
      (row) => row.id === requestId
    );
    expect(mineRow?.status).toBe('approved');
  });
});
