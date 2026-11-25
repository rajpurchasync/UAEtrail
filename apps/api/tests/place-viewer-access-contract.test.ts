import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ActivityType, LocationStatus } from '../src/domain/enums.js';
import { createLocationRecord } from '../src/lib/activities-store.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

describe('place viewerAccess (CPC-3)', () => {
  it('returns viewerAccess on GET /places/:id for active catalog rows', async () => {
    const suffix = `pva-${Date.now()}`;
    const place = await createLocationRecord({
      name: `Viewer trail ${suffix}`,
      region: 'Dubai',
      activityType: ActivityType.HIKING,
      status: LocationStatus.ACTIVE,
      featured: false,
      latitude: 25.1,
      longitude: 55.2,
      countryCode: 'AE',
      images: ['https://example.com/trail-viewer.jpg'],
      tags: [],
      registryListed: true,
      destinationId: 'area-test-dubai',
      description: 'Contract trail for place viewerAccess on public place detail reads.',
    });

    const response = await request(app).get(`/api/places/${place.id}`);
    expect(response.status).toBe(200);
    expect(response.body.viewerAccess?.level).toBe('public');
    expect(response.body.viewerAccess?.canOpenDetailPage).toBe(true);
    expect(response.body.viewerAccess?.allowedActions).toContain('view_detail');
  });
});
