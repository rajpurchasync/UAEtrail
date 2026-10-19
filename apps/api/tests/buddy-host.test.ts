import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { registerVerifiedVisitor } from './helpers/fixtures.js';
import { createTenantRecord } from '../src/lib/tenant-store.js';
import { TenantStatus, TenantType } from '../src/domain/enums.js';
import { findAuthUserByEmail } from '../src/lib/auth-users-store.js';
import { getMongoClient } from '../src/lib/mongo.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

const completeSignupProfile = async (accessToken: string) => {
  const res = await request(app)
    .patch('/api/me/profile/signup-details')
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

describe('buddy host access', () => {
  it('allows tenant owner without membership row on /publishing and backfills membership', async () => {
    const visitor = await registerVerifiedVisitor(app, `owner-no-mem-${Date.now()}`);
    const user = await findAuthUserByEmail(visitor.email);
    if (!user) throw new Error('expected user');

    const tenant = await createTenantRecord({
      name: `Owner Only ${Date.now()}`,
      slug: `owner-only-${Date.now()}`,
      type: TenantType.GUIDE_OWNED,
      status: TenantStatus.ACTIVE,
      ownerId: user._id,
    });

    const db = getMongoClient()!.db();
    await db.collection('tenant_memberships').deleteMany({ tenantId: tenant.id, userId: user._id });

    const canonical = await request(app)
      .get('/api/publishing/activities')
      .set('Authorization', `Bearer ${visitor.accessToken}`)
      .set('x-organisation-id', tenant.id);
    expect(canonical.status).toBe(200);

    const membership = await db.collection('tenant_memberships').findOne({
      tenantId: tenant.id,
      userId: user._id,
      isActive: { $ne: false },
    });
    expect(membership).toBeTruthy();
    expect(membership?.role).toBe('TENANT_OWNER');
  });

  it('sets canPublish and tenantId after signup profile is complete', async () => {
    const visitor = await registerVerifiedVisitor(app, `buddy-publish-${Date.now()}`);

    const before = await request(app)
      .get('/api/me/status')
      .set('Authorization', `Bearer ${visitor.accessToken}`);
    expect(before.status).toBe(200);
    expect(before.body.data.publish.canPublish).toBe(false);
    expect(before.body.data.publish.isCommunityHost).toBe(false);

    await completeSignupProfile(visitor.accessToken);

    const after = await request(app)
      .get('/api/me/status')
      .set('Authorization', `Bearer ${visitor.accessToken}`);
    expect(after.status).toBe(200);
    expect(after.body.data.profileComplete).toBe(true);
    expect(after.body.data.publish.canPublish).toBe(true);
    expect(after.body.data.publish.tenantId).toBeTruthy();
    expect(after.body.data.publish.hasGuideProfile).toBe(true);
  });
});
