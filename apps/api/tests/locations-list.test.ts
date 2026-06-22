import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('GET /api/v1/locations', () => {
  it('returns active locations with hiking/camping activity types', async () => {
    const response = await request(app).get('/api/v1/locations').query({ pageSize: 100 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta?.total).toBeGreaterThanOrEqual(0);

    for (const row of response.body.data as { activityType: string; status: string }[]) {
      expect(['hiking', 'camping']).toContain(row.activityType);
      expect(row.status).toBe('active');
    }
  });
});
