import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { completeTestGuideProfile } from './helpers/member-profile-test-helpers.js';
import { createAuthUser } from '../src/lib/auth-users-store.js';
import { UserRole, UserStatus } from '../src/domain/enums.js';
import { generateReferralCode } from '../src/lib/referral-code.js';
import bcrypt from 'bcryptjs';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

const signInToken = async (email: string, password: string): Promise<string> => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.tokens.accessToken as string;
};

describe('member availability', () => {
  it('PUT /me/availability persists slots and GET returns pruned future ranges', async () => {
    const suffix = `avail-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Avail Member', phone: null, bio: null, avatarUrl: null },
    });

    const token = await signInToken(user.email, password);
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const start = tomorrow.toISOString().slice(0, 10);
    const end = start;

    const put = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kinds: ['hiking'],
        visibility: 'public',
        slots: [{ startDate: start, endDate: end }],
      });
    expect(put.status).toBe(200);
    expect(put.body.data.slots).toHaveLength(1);

    const exploreGuest = await request(app).get(
      `/api/explore/people/availability?from=${start}&to=${end}&kind=hiking`
    );
    expect(exploreGuest.status).toBe(200);
    expect(
      exploreGuest.body.data.people.some((p: { userId: string }) => p.userId === user._id)
    ).toBe(true);

    const explore = await request(app)
      .get(`/api/explore/people/availability?from=${start}&to=${end}&kind=hiking`)
      .set('Authorization', `Bearer ${token}`);
    expect(explore.status).toBe(200);
    expect(
      explore.body.data.people.some((p: { userId: string }) => p.userId === user._id)
    ).toBe(true);
    expect(explore.body.data.clusters.length).toBeGreaterThan(0);

    const matchPreview = await request(app)
      .get('/api/me/availability/match-preview')
      .set('Authorization', `Bearer ${token}`);
    expect(matchPreview.status).toBe(200);
    expect(matchPreview.body.data).toMatchObject({
      hostedOutings: expect.any(Array),
    });
  });

  it('friends-only visibility hides rows from strangers', async () => {
    const suffix = `avail-bud-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);

    const owner = await createAuthUser({
      email: `avail-owner-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Owner', phone: null, bio: null, avatarUrl: null },
    });
    const stranger = await createAuthUser({
      email: `avail-stranger-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Stranger', phone: null, bio: null, avatarUrl: null },
    });

    const ownerToken = await signInToken(owner.email, password);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 2);
    const iso = start.toISOString().slice(0, 10);

    await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        kinds: ['camping'],
        visibility: 'friends',
        slots: [{ startDate: iso, endDate: iso }],
      });

    const strangerToken = await signInToken(stranger.email, password);
    const strangerRes = await request(app)
      .get(`/api/explore/people/availability?from=${iso}&to=${iso}`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect(strangerRes.status).toBe(200);
    expect(
      strangerRes.body.data.people.some((p: { userId: string }) => p.userId === owner._id)
    ).toBe(false);
  });

  it('rejects retired buddies visibility wire on write', async () => {
    const suffix = `avail-legacy-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-legacy-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Legacy', phone: null, bio: null, avatarUrl: null },
    });
    const token = await signInToken(user.email, password);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 2);
    const iso = start.toISOString().slice(0, 10);

    const put = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kinds: ['hiking'],
        visibility: 'buddies',
        slots: [{ startDate: iso, endDate: iso }],
      });
    expect(put.status).toBe(400);
  });

  it('B1: derives kinds from slot modalities and ignores mismatched top-level kinds', async () => {
    const suffix = `avail-b1-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-b1-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'B1', phone: null, bio: null, avatarUrl: null },
    });
    const token = await signInToken(user.email, password);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 3);
    const iso = start.toISOString().slice(0, 10);

    const put = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kinds: ['camping'],
        visibility: 'public',
        slots: [
          {
            startDate: iso,
            endDate: iso,
            capacity: 'participant',
            modalities: ['hiking'],
          },
        ],
      });
    expect(put.status).toBe(200);
    expect(put.body.data.kinds).toEqual(['hiking']);
    expect(put.body.data.slots[0].modalities).toEqual(['hiking']);
    expect(put.body.data.slots[0].capacity).toBe('participant');
  });

  it('B1: rejects guide modality in slot', async () => {
    const suffix = `avail-guide-mod-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-guide-mod-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Mod', phone: null, bio: null, avatarUrl: null },
    });
    const token = await signInToken(user.email, password);
    const iso = new Date();
    iso.setUTCDate(iso.getUTCDate() + 3);
    const day = iso.toISOString().slice(0, 10);

    const put = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visibility: 'public',
        slots: [
          {
            startDate: day,
            endDate: day,
            capacity: 'participant',
            modalities: ['guide'],
          },
        ],
      });
    expect(put.status).toBe(400);
    expect(put.body.error?.code ?? put.body.code).toBe('guide_modality_forbidden');
  });

  it('B1: guide capacity requires completed guide profile', async () => {
    const suffix = `avail-guide-cap-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-guide-cap-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Cap', phone: null, bio: null, avatarUrl: null },
    });
    const token = await signInToken(user.email, password);
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + 3);
    const iso = day.toISOString().slice(0, 10);

    const blocked = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visibility: 'public',
        slots: [{ startDate: iso, endDate: iso, capacity: 'guide', modalities: ['hiking'] }],
      });
    expect(blocked.status).toBe(400);
    expect(blocked.body.error?.code ?? blocked.body.code).toBe('guide_profile_required');

    await completeTestGuideProfile(app, token);
    const ok = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visibility: 'public',
        slots: [{ startDate: iso, endDate: iso, capacity: 'guide', modalities: ['hiking'] }],
      });
    expect(ok.status).toBe(200);
    expect(ok.body.data.kinds).toContain('guide');
    expect(ok.body.data.kinds).toContain('hiking');

    const exploreGuide = await request(app)
      .get(`/api/explore/people/availability?from=${iso}&to=${iso}&kind=guide`)
      .set('Authorization', `Bearer ${token}`);
    expect(exploreGuide.status).toBe(200);
    expect(
      exploreGuide.body.data.people.some((p: { userId: string }) => p.userId === user._id)
    ).toBe(true);
    expect(exploreGuide.body.data.clusters.some((c: { kind: string }) => c.kind === 'guide')).toBe(
      true
    );
  });

  it('persists open slot destinationRegions', async () => {
    const suffix = `avail-reg-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-reg-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Regions', phone: null, bio: null, avatarUrl: null },
    });
    const token = await signInToken(user.email, password);
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + 5);
    const iso = day.toISOString().slice(0, 10);

    const put = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visibility: 'public',
        slots: [
          {
            scheduleKind: 'open',
            startDate: iso,
            endDate: iso,
            capacity: 'participant',
            modalities: ['hiking'],
            destinationRegions: ['Dubai', 'Sharjah'],
            partySize: 1,
          },
        ],
      });
    expect(put.status).toBe(200);
    expect(put.body.data.slots[0]?.destinationRegions).toEqual(['Dubai', 'Sharjah']);
  });

  it('filters explore availability by region query (destinationRegions)', async () => {
    const suffix = `avail-region-filter-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + 6);
    const iso = day.toISOString().slice(0, 10);

    const createMember = async (label: string, regions: string[]) => {
      const user = await createAuthUser({
        email: `avail-region-${label}-${suffix}@test.local`,
        passwordHash: hash,
        googleId: null,
        authProvider: 'EMAIL',
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        referralCode: generateReferralCode(),
        profile: { displayName: label, phone: null, bio: null, avatarUrl: null },
      });
      const token = await signInToken(user.email, password);
      await request(app)
        .put('/api/me/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visibility: 'public',
          slots: [
            {
              scheduleKind: 'open',
              startDate: iso,
              endDate: iso,
              capacity: 'participant',
              modalities: ['hiking'],
              destinationRegions: regions,
            },
          ],
        });
      return user;
    };

    const dubaiOnly = await createMember('Dubai', ['Dubai']);
    const sharjahOnly = await createMember('Sharjah', ['Sharjah']);

    const dubaiRes = await request(app).get(
      `/api/explore/people/availability?from=${iso}&to=${iso}&region=Dubai`
    );
    expect(dubaiRes.status).toBe(200);
    const dubaiIds = new Set(dubaiRes.body.data.people.map((p: { userId: string }) => p.userId));
    expect(dubaiIds.has(dubaiOnly._id)).toBe(true);
    expect(dubaiIds.has(sharjahOnly._id)).toBe(false);

    const sharjahRes = await request(app).get(
      `/api/explore/people/availability?from=${iso}&to=${iso}&region=Sharjah`
    );
    expect(sharjahRes.status).toBe(200);
    const sharjahIds = new Set(sharjahRes.body.data.people.map((p: { userId: string }) => p.userId));
    expect(sharjahIds.has(sharjahOnly._id)).toBe(true);
    expect(sharjahIds.has(dubaiOnly._id)).toBe(false);
  });

  it('persists slot logistics (party + transport) on PUT and returns on GET', async () => {
    const suffix = `avail-log-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-log-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Logistics', phone: null, bio: null, avatarUrl: null },
    });
    const token = await signInToken(user.email, password);
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + 3);
    const iso = day.toISOString().slice(0, 10);

    const put = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visibility: 'public',
        slots: [
          {
            scheduleKind: 'fixed',
            startDate: iso,
            endDate: iso,
            title: 'Hatta ride',
            latitude: 25.05,
            longitude: 55.12,
            capacity: 'participant',
            modalities: ['hiking'],
            partySize: 2,
            transportMode: 'needs_carpool',
            carpoolSeatsNeeded: 2,
          },
        ],
      });
    expect(put.status).toBe(200);
    expect(put.body.data.slots[0]).toMatchObject({
      partySize: 2,
      transportMode: 'needs_carpool',
      carpoolSeatsNeeded: 2,
    });

    const get = await request(app)
      .get('/api/me/availability')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.data.slots[0]?.transportMode).toBe('needs_carpool');

    const explore = await request(app).get(
      `/api/explore/people/availability?from=${iso}&to=${iso}&kind=hiking`
    );
    expect(explore.status).toBe(200);
    const row = explore.body.data.people.find((p: { userId: string }) => p.userId === user._id);
    expect(row?.slots?.[0]?.partySize).toBe(2);
  });

  it('C1: rejects paid guide terms without Pro', async () => {
    const suffix = `avail-paid-${Date.now()}`;
    const password = 'TestPass1!';
    const hash = await bcrypt.hash(password, 10);
    const user = await createAuthUser({
      email: `avail-paid-${suffix}@test.local`,
      passwordHash: hash,
      googleId: null,
      authProvider: 'EMAIL',
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { displayName: 'Paid', phone: null, bio: null, avatarUrl: null },
    });
    const token = await signInToken(user.email, password);
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + 4);
    const iso = day.toISOString().slice(0, 10);

    await completeTestGuideProfile(app, token);

    const blocked = await request(app)
      .put('/api/me/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visibility: 'public',
        slots: [
          {
            startDate: iso,
            endDate: iso,
            capacity: 'guide',
            modalities: ['hiking'],
            engagementTerms: { pricingKind: 'paid', rate: 500 },
          },
        ],
      });
    expect(blocked.status).toBe(400);
    expect(blocked.body.error?.code ?? blocked.body.code).toBe('paid_terms_not_allowed');
  });
});
