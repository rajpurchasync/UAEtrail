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
import { getMongoClient } from '../src/lib/mongo.js';
import { RSVP_PARTICIPATION_REQUIREMENT } from '@uaetrail/shared-types';

let app: Express;
const suffix = `${Date.now()}`;
let approvalFixture: PublishedEventFixture;
let rsvpFixture: PublishedEventFixture;
let visitor: { email: string; password: string; accessToken: string };

beforeAll(async () => {
  app = await bootstrapTestApp();
  approvalFixture = await createPublishedEventFixture(`${suffix}-approval`);
  rsvpFixture = await createPublishedEventFixture(`${suffix}-rsvp`);

  await getMongoClient()!
    .db()
    .collection('activities')
    .updateOne(
      { _id: rsvpFixture.activityId },
      {
        $set: {
          participationMode: 'rsvp',
          requirements: [RSVP_PARTICIPATION_REQUIREMENT],
        },
      }
    );

  visitor = await registerVerifiedVisitor(app, suffix);
});

afterAll(async () => {
  await cleanupEventFixture(approvalFixture);
  await cleanupEventFixture(rsvpFixture);
  await cleanupTestUsers();
});

describe('activity RSVP flow integration', () => {
  const loginToken = async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: visitor.email, password: visitor.password });
    expect(login.status).toBe(200);
    return login.body.tokens.accessToken as string;
  };

  it('creates confirmed participation on RSVP activities', async () => {
    const token = await loginToken();

    const rsvpRes = await request(app)
      .post(`/api/v1/activities/${rsvpFixture.activityId}/rsvp`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(rsvpRes.status).toBe(201);
    expect(rsvpRes.body.data.request.status).toBe('approved');
    expect(rsvpRes.body.data.participation.status).toBe('confirmed');

    const detailRes = await request(app)
      .get(`/api/v1/activities/${rsvpFixture.activityId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.myParticipation?.status).toBe('confirmed');
  });

  it('rejects join requests on RSVP activities', async () => {
    const waitlistVisitor = await registerVerifiedVisitor(app, `${suffix}-rsvp-blocked`);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: waitlistVisitor.email, password: waitlistVisitor.password });
    const token = login.body.tokens.accessToken as string;

    const joinRes = await request(app)
      .post(`/api/v1/activities/${rsvpFixture.activityId}/requests`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Should fail' });

    expect(joinRes.status).toBe(400);
    expect(joinRes.body.error.code).toBe('use_rsvp_endpoint');
  });

  it('rejects RSVP on approval activities', async () => {
    const waitlistVisitor = await registerVerifiedVisitor(app, `${suffix}-approval-rsvp`);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: waitlistVisitor.email, password: waitlistVisitor.password });
    const token = login.body.tokens.accessToken as string;

    const rsvpRes = await request(app)
      .post(`/api/v1/activities/${approvalFixture.activityId}/rsvp`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(rsvpRes.status).toBe(400);
    expect(rsvpRes.body.error.code).toBe('approval_required');
  });

  it('lists RSVP activity in /me/activities', async () => {
    const token = await loginToken();

    const meRes = await request(app)
      .get('/api/v1/me/activities')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.some((row: { id: string }) => row.id === rsvpFixture.activityId)).toBe(true);
  });
});
