import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const OPENAPI = join(process.cwd(), 'src/openapi.ts');

describe('engagement OpenAPI contract', () => {
  it('documents wishlist, entity follow, goals, and member following paths', () => {
    const source = readFileSync(OPENAPI, 'utf8');
    const required = [
      "'/me/wishlist'",
      "'/me/wishlist/{id}'",
      "'/me/wishlist/check'",
      "'/me/entity-follows'",
      "'/me/entity-follows/{id}'",
      "'/me/entity-follows/check'",
      "'/me/following'",
      "'/me/following/{userId}'",
      "'/me/goals'",
      "'/me/goals/{id}'",
      "'/me/goals/active'",
      "'/me/export'",
    ];
    for (const path of required) {
      expect(source, `missing OpenAPI path ${path}`).toContain(path);
    }
  });
});
