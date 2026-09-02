import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import {
  cleanupEventFixture,
  cleanupTestUsers,
  createFullEventFixture,
  createPublishedEventFixture,
  registerVerifiedVisitor,
  type PublishedEventFixture
} from './helpers/fixtures.js';

let app: Express;
const suffix = `${Date.now()}`;
let openFixture: PublishedEventFixture;
let fullFixture: PublishedEventFixture;
let visitor: { email: string; password: string; accessToken: string };

beforeAll(async () => {
  app = await bootstrapTestApp();
  openFixture = await createPublishedEventFixture(suffix);
  fullFixture = await createFullEventFixture(suffix);
  visitor = await registerVerifiedVisitor(app, suffix);
});

afterAll(async () => {
  await cleanupEventFixture(openFixture);
  await cleanupEventFixture(fullFixture);
  await cleanupTestUsers();
});

describe('join request flow integration', () => {
  it('logs in verified visitor account', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: visitor.email, password: visitor.password });

    expect(response.status).toBe(200);
    expect(response.body.tokens.accessToken).toBeTruthy();
    expect(response.body.tokens.refreshToken).toBeUndefined();
  });

  it('submits pending join request when slots are available', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: visitor.email, password: visitor.password });

    expect(login.status).toBe(200);
    const token = login.body.tokens.accessToken as string;

    const joinRes = await request(app)
      .post(`/api/v1/activities/${openFixture.activityId}/requests`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Integration test request' });

    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.activityId).toBe(openFixture.activityId);
    expect(joinRes.body.data.status).toBe('pending');
    expect(joinRes.body.data.waitlisted).toBe(false);
  });

  it('returns waitlisted status when event is at capacity', async () => {
    const waitlistVisitor = await registerVerifiedVisitor(app, `${suffix}-waitlist`);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: waitlistVisitor.email, password: waitlistVisitor.password });

    expect(login.status).toBe(200);
    const token = login.body.tokens.accessToken as string;

    const joinRes = await request(app)
      .post(`/api/v1/activities/${fullFixture.activityId}/requests`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Waitlist integration test' });

    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.activityId).toBe(fullFixture.activityId);
    expect(joinRes.body.data.status).toBe('waitlisted');
    expect(joinRes.body.data.waitlisted).toBe(true);
  });

  it('lists published events including the test fixture', async () => {
    const response = await request(app).get('/api/v1/activities');
    expect(response.status).toBe(200);
    expect(response.body.data.some((event: { id: string }) => event.id === openFixture.activityId)).toBe(true);
  });
});
