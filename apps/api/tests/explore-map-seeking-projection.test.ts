import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';

let app: Express;

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

beforeAll(async () => {
  app = await bootstrapTestApp();
});

describe('GET /api/explore/map seeking projection retired (MIG-DISCO-REG)', () => {
  it('catalog builder skips legacy activityMode seeking rows', () => {
    const base = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(base).toMatch(/isRetiredSeekingActivityMode\(event\.activityMode\)\) continue/);
  });

  it('default map payload has no seeking activityMode or demand pins', async () => {
    await invalidateExploreMapCache();
    const response = await request(app).get('/api/explore/map');
    expect(response.status).toBe(200);

    const items = response.body.data.items as Array<{
      id?: string;
      activityMode?: string | null;
      participantIntentId?: string | null;
    }>;

    expect(items.every((item) => item.activityMode !== 'seeking')).toBe(true);
    expect(items.every((item) => !String(item.id ?? '').startsWith('demand:'))).toBe(true);
    expect(items.every((item) => !item.participantIntentId)).toBe(true);
  });
});