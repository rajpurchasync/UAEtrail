import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { registerVerifiedVisitor } from './helpers/fixtures.js';
import { createTenantRecord } from '../src/lib/tenant-store.js';
import { upsertTenantMembership } from '../src/lib/tenant-access.js';
import { MembershipRole, TenantStatus, TenantType, UserRole } from '../src/domain/enums.js';
import { findAuthUserByEmail, updateAuthUserCore } from '../src/lib/auth-users.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('access management', () => {
  it('disables organizer team access and removes it from the active list', async () => {
    const owner = await registerVerifiedVisitor(app, `team-owner-${Date.now()}`);
    const teammate = await registerVerifiedVisitor(app, `team-member-${Date.now()}`);
    const ownerUser = await findAuthUserByEmail(owner.email);
    const teammateUser = await findAuthUserByEmail(teammate.email);

    if (!ownerUser || !teammateUser) {
      throw new Error('expected test users to exist');
    }

    const tenant = await createTenantRecord({
      name: `Team Tenant ${Date.now()}`,
      slug: `team-tenant-${Date.now()}`,
      type: TenantType.GUIDE_OWNED,
      status: TenantStatus.ACTIVE,
      ownerId: ownerUser._id
    });

    await upsertTenantMembership({
      tenantId: tenant.id,
      userId: ownerUser._id,
      role: MembershipRole.TENANT_OWNER
    });

    await updateAuthUserCore({ userId: ownerUser._id, role: UserRole.TENANT_OWNER });
    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: owner.email, password: owner.password });
    expect(ownerLogin.status).toBe(200);
    const ownerToken = ownerLogin.body.tokens.accessToken as string;

    const addRes = await request(app)
      .post('/api/v1/organizer/team')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenant.id)
      .send({ email: teammate.email, role: 'tenant_guide' });

    expect(addRes.status).toBe(201);
    const membershipId = String(addRes.body.data.id);

    const disableRes = await request(app)
      .patch(`/api/v1/organizer/team/${membershipId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenant.id)
      .send({ isActive: false });

    expect(disableRes.status).toBe(200);
    expect(disableRes.body.data.isActive).toBe(false);

    const listRes = await request(app)
      .get('/api/v1/organizer/team')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenant.id);

    expect(listRes.status).toBe(200);
    const disabledMember = listRes.body.data.find((member: { id: string }) => member.id === membershipId);
    expect(disabledMember.isActive).toBe(false);

    const blockedEventsRes = await request(app)
      .get('/api/v1/host/activities')
      .set('Authorization', `Bearer ${teammate.accessToken}`)
      .set('x-tenant-id', tenant.id);

    expect(blockedEventsRes.status).toBe(403);

    const tenantsRes = await request(app)
      .get('/api/v1/me/tenants')
      .set('Authorization', `Bearer ${teammate.accessToken}`);

    expect(tenantsRes.status).toBe(200);
    expect(tenantsRes.body.data.find((item: { tenantId: string }) => item.tenantId === tenant.id)).toBeUndefined();
  });

  it('disables and removes group memberships for family groups', async () => {
    const admin = await registerVerifiedVisitor(app, `group-admin-${Date.now()}`);
    const member = await registerVerifiedVisitor(app, `group-member-${Date.now()}`);
    const adminUser = await findAuthUserByEmail(admin.email);
    const memberUser = await findAuthUserByEmail(member.email);

    if (!adminUser || !memberUser) {
      throw new Error('expected group test users to exist');
    }

    const createGroupRes = await request(app)
      .post('/api/v1/me/groups')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'family', name: `Test Group ${Date.now()}` });

    expect(createGroupRes.status).toBe(201);
    const groupId = createGroupRes.body.data.id;

    const detailRes = await request(app)
      .get(`/api/v1/me/groups/${groupId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(detailRes.status).toBe(200);
    const membershipId = String(detailRes.body.data.membership.id);

    const disableRes = await request(app)
      .patch(`/api/v1/me/groups/${groupId}/members/${membershipId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isActive: false });

    expect(disableRes.status).toBe(200);
    expect(disableRes.body.data.isActive).toBe(false);

    const refreshedDetailRes = await request(app)
      .get(`/api/v1/me/groups/${groupId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(refreshedDetailRes.status).toBe(200);
    const disabledMember = refreshedDetailRes.body.data.members.find((item: { id: string }) => item.id === membershipId);
    expect(disabledMember.isActive).toBe(false);

    const removeRes = await request(app)
      .delete(`/api/v1/me/groups/${groupId}/members/${membershipId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.removed).toBe(true);
  });
});
