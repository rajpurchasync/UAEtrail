import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { ensureCuratedAreasSeeded, testAreas } from './helpers/test-seed.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
});

describe('GET /api/areas', () => {
  it('lists published curated areas', async () => {
    const res = await request(app).get('/api/areas');
    expect(res.status).toBe(200);
    const slugs = (res.body.data as Array<{ slug: string }>).map((row) => row.slug);
    expect(slugs).toContain(testAreas.hatta.slug);
    expect(slugs).toContain(testAreas.jebelJais.slug);
    expect(slugs.length).toBeGreaterThanOrEqual(10);
  });

  it('returns area detail card by slug', async () => {
    const res = await request(app).get(`/api/areas/${testAreas.hatta.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.area.slug).toBe(testAreas.hatta.slug);
    expect(res.body.data.counts).toMatchObject({
      activities: expect.any(Number),
      places: expect.any(Number),
      seeking: expect.any(Number),
    });
    expect(res.body.data.preview).toMatchObject({
      activities: expect.any(Array),
      places: expect.any(Array),
    });
  });
});
