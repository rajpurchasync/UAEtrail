import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { createApp } from '../src/app.js';
import { configureTestEnv } from './helpers/bootstrap.js';
import { resetMetrics } from '../src/lib/metrics.js';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
});

describe('health endpoint', () => {
  it('returns status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('observability endpoints', () => {
  it('exposes a metrics endpoint with Prometheus content', async () => {
    resetMetrics();
    const testApp = await createApp();
    const response = await request(testApp).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.text).toContain('http_requests_total');
    expect(response.text).toContain('api_errors_total');
  });
});
