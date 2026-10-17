import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { cleanupTestUsers, registerVerifiedVisitor } from './helpers/fixtures.js';

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

afterAll(async () => {
  await cleanupTestUsers();
});

describe('GET /users/browse', () => {
  it('allows any signed-in member (not host-Pro gated)', async () => {
    const suffix = `browse-free-${Date.now()}`;
    const visitor = await registerVerifiedVisitor(app, suffix);

    const res = await request(app)
      .get('/api/users/browse?page=1&pageSize=10')
      .set('Authorization', `Bearer ${visitor.accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
