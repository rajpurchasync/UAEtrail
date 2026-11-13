import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { registerVerifiedVisitor } from './helpers/fixtures.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('profile field privacy', () => {
  it('PATCH /me/profile/field-privacy redacts stats on public member read', async () => {
    const suffix = `field-privacy-${Date.now()}`;
    const owner = await registerVerifiedVisitor(app, `${suffix}-owner`);
    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: owner.email, password: owner.password })
      .expect(200);
    const token = ownerLogin.body.tokens.accessToken as string;
    const userId = ownerLogin.body.user.id as string;

    await request(app)
      .patch('/api/me/profile/field-privacy')
      .set('Authorization', `Bearer ${token}`)
      .send({ fieldPrivacy: { stats: 'hidden', tripHistory: 'public' } })
      .expect(200);

    const ownerProfile = await request(app)
      .get(`/api/member/${userId}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(ownerProfile.body.data.stats).not.toBeNull();

    const viewer = await registerVerifiedVisitor(app, `${suffix}-viewer`);
    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: viewer.email, password: viewer.password })
      .expect(200);
    const viewerToken = viewerLogin.body.tokens.accessToken as string;

    const publicRead = await request(app)
      .get(`/api/member/${userId}/profile`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);

    expect(publicRead.body.data.stats).toBeNull();
  });

  it('PATCH findCrewVisibility none hides member from Free availability browse', async () => {
    const suffix = `find-crew-${Date.now()}`;
    const owner = await registerVerifiedVisitor(app, `${suffix}-owner`);
    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: owner.email, password: owner.password })
      .expect(200);
    const token = ownerLogin.body.tokens.accessToken as string;
    const userId = ownerLogin.body.user.id as string;

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const start = tomorrow.toISOString().slice(0, 10);

    await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kinds: ['hiking'],
        visibility: 'public',
        slots: [{ startDate: start, endDate: start }],
      })
      .expect(200);

    await request(app)
      .patch('/api/me/profile/field-privacy')
      .set('Authorization', `Bearer ${token}`)
      .send({ findCrewVisibility: 'none' })
      .expect(200);

    const me = await request(app)
      .get('/api/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.data.findCrewVisibility).toBe('none');

    const viewer = await registerVerifiedVisitor(app, `${suffix}-viewer`);
    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: viewer.email, password: viewer.password })
      .expect(200);
    const viewerToken = viewerLogin.body.tokens.accessToken as string;

    const explore = await request(app)
      .get(`/api/explore/people/availability?from=${start}&to=${start}&kind=hiking`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);

    expect(
      explore.body.data.people.some((p: { userId: string }) => p.userId === userId)
    ).toBe(false);
  });
});
