import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const manifest = JSON.parse(
  readFileSync(join(ROOT, 'scripts/governance/bounded-context-manifest.json'), 'utf8')
) as {
  contexts: Array<{
    id: string;
    apiFiles: string[];
    routeRegistrars: string[];
  }>;
  apiMounts: Array<{ prefix: string; file: string }>;
  removedProducts: Record<string, { bannedRouteFiles?: string[] }>;
};

const exists = (rel: string) => existsSync(join(ROOT, rel));

describe('boundedContextAlignment (API + manifest)', () => {
  it('each bounded context keeps required API files and route registrars', () => {
    const violations: string[] = [];
    for (const ctx of manifest.contexts) {
      for (const file of [...ctx.apiFiles, ...ctx.routeRegistrars]) {
        if (file && !exists(file)) violations.push(`${ctx.id}: missing ${file}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('top-level API mounts exist', () => {
    const violations: string[] = [];
    for (const mount of manifest.apiMounts) {
      if (mount.file.startsWith('apps/') && !exists(mount.file)) {
        violations.push(`mount ${mount.prefix}: missing ${mount.file}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('removed product route registrars are not present', () => {
    const violations: string[] = [];
    for (const product of Object.values(manifest.removedProducts)) {
      for (const file of product.bannedRouteFiles ?? []) {
        if (exists(file)) violations.push(`removed API route file: ${file}`);
      }
    }
    const userRouter = readFileSync(join(ROOT, 'apps/api/src/routes/user.ts'), 'utf8');
    if (/registerMeRewardsRoutes|registerPublicRewardsRoutes/.test(userRouter)) {
      violations.push('user.ts still registers rewards wallet routes');
    }
    expect(violations).toEqual([]);
  });

  it('collections.ts is the only COLLECTIONS definition in API lib', () => {
    const collections = readFileSync(join(ROOT, 'apps/api/src/lib/collections.ts'), 'utf8');
    expect(collections).toMatch(/ACTIVITIES/);
    expect(collections).toMatch(/PARTICIPANT_INTENTS/);
    expect(collections).toMatch(/USER_BADGES/);
    expect(collections).toMatch(/DESTINATIONS: 'areas'/);
    expect(collections).toMatch(/AREAS: 'areas'/);
  });

  it('user route registrars follow register* surface-first modules (no orphan handlers)', () => {
    const userDir = join(ROOT, 'apps/api/src/routes/user');
    const violations: string[] = [];
    for (const entry of readdirSync(userDir)) {
      if (!entry.endsWith('.ts') || entry.endsWith('.test.ts')) continue;
      if (entry === 'schemas.ts') continue;
      if (!entry.startsWith('register') && !entry.startsWith('composeUser')) {
        violations.push(`routes/user/${entry}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('tenant + commerce route folders use register* modules (shared API methodology)', () => {
    const assertRegisterOnly = (relDir: string, schemaAllowlist: string[]) => {
      const dir = join(ROOT, relDir);
      const violations: string[] = [];
      for (const entry of readdirSync(dir)) {
        if (!entry.endsWith('.ts') || entry.endsWith('.test.ts')) continue;
        if (schemaAllowlist.includes(entry)) continue;
        if (!entry.startsWith('register')) violations.push(`${relDir}/${entry}`);
      }
      return violations;
    };
    expect(
      [
        ...assertRegisterOnly('apps/api/src/routes/publishing', ['publishing-route-schemas.ts']),
        ...assertRegisterOnly('apps/api/src/routes/shop', ['shop-route-schemas.ts']),
        ...assertRegisterOnly('apps/api/src/routes/admin', []),
      ]
    ).toEqual([]);
  });
});
