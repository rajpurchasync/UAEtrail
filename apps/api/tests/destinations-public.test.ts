import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { ensurecuratedDestinationsSeeded, testAreas } from './helpers/test-seed.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
  await ensurecuratedDestinationsSeeded();
});

describe('GET /api/destinations', () => {
  it('lists published curated destinations (same ids as areas)', async () => {
    const res = await request(app).get('/api/destinations');
    expect(res.status).toBe(200);
    expect(res.headers.deprecation).toBeUndefined();
    const slugs = (res.body.data as Array<{ slug: string; id: string }>).map((row) => row.slug);
    expect(slugs).toContain(testAreas.hatta.slug);
    const hatta = (res.body.data as Array<{ id: string; slug: string }>).find(
      (row) => row.slug === testAreas.hatta.slug
    );
    expect(hatta?.id).toBe(testAreas.hatta.id);
    expect(slugs.length).toBeGreaterThanOrEqual(10);
  });

  it('returns destination detail card by slug', async () => {
    const res = await request(app).get(`/api/destinations/${testAreas.hatta.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.destination.slug).toBe(testAreas.hatta.slug);
    expect(res.body.data.destination.id).toBe(testAreas.hatta.id);
    expect(res.body.data.counts).toMatchObject({
      activities: expect.any(Number),
      places: expect.any(Number),
      availability: expect.any(Number),
    });
    expect(res.body.data.preview).toMatchObject({
      activities: expect.any(Array),
      places: expect.any(Array),
    });
  });
});