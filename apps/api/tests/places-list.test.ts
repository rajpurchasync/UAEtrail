import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('GET /api/places', () => {
  it('returns active places with hiking activity type', async () => {
    const response = await request(app)
      .get('/api/places')
      .query({ pageSize: 100, activityType: 'hiking' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta?.total).toBeGreaterThanOrEqual(0);

    for (const row of response.body.data as { activityType: string; status: string }[]) {
      expect(row.activityType).toBe('hiking');
      expect(row.status).toBe('active');
    }
  });

  it('returns 410 for retired GET /api/locations', async () => {
    const legacy = await request(app)
      .get('/api/locations')
      .query({ pageSize: 5, activityType: 'hiking' });

    expect(legacy.status).toBe(410);
    expect(legacy.headers.deprecation).toBe('true');
    expect(legacy.body.message).toMatch(/GET \/locations is retired; use GET \/places/);
  });
});