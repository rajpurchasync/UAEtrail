import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { seedCuratedAreas } from '../src/lib/seed-areas.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
  await seedCuratedAreas();
});

describe('GET /api/v1/areas', () => {
  it('lists published curated areas', async () => {
    const res = await request(app).get('/api/v1/areas');
    expect(res.status).toBe(200);
    const slugs = (res.body.data as Array<{ slug: string }>).map((row) => row.slug);
    expect(slugs).toContain('hatta');
    expect(slugs).toContain('jebel-jais');
  });

  it('returns area detail card by slug', async () => {
    const res = await request(app).get('/api/v1/areas/hatta');
    expect(res.status).toBe(200);
    expect(res.body.data.area.slug).toBe('hatta');
    expect(res.body.data.counts).toMatchObject({
      activities: expect.any(Number),
      places: expect.any(Number),
      seeking: expect.any(Number),
    });
  });
});
