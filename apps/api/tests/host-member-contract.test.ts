import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join(process.cwd(), 'src');
const HOST_ROUTES_DIR = join(API_SRC, 'routes', 'host');

const collectTsFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('host-member API contracts', () => {
  it('does not reintroduce ambiguous host join-request registrar names', () => {
    expect(existsSync(join(HOST_ROUTES_DIR, 'registerHostJoinRequestRoutes.ts'))).toBe(false);

    const hostFiles = collectTsFiles(HOST_ROUTES_DIR);
    const violations: string[] = [];
    for (const file of hostFiles) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/registerHostJoinRequestRoutes/.test(content)) {
        violations.push(`${file}: use registerHostActivityRequestRoutes`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('notification meta uses PRO_MEMBERSHIP_PATH constant instead of raw /become-host', () => {
    const scanRoots = [join(API_SRC, 'routes'), join(API_SRC, 'services')];
    const violations: string[] = [];

    for (const root of scanRoots) {
      for (const file of collectTsFiles(root)) {
        if (file.includes('member-routes.ts')) continue;
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/path:\s*['"]\/become-host['"]/.test(content)) {
          violations.push(`${file}: import PRO_MEMBERSHIP_PATH from lib/member-routes.js`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('member-host-tiers uses TenantPublishingPurpose not string', () => {
    const path = join(API_SRC, 'domain', 'member-host-tiers.ts');
    const content = readFileSync(path, 'utf8');
    expect(content).not.toMatch(/publishingPurpose\?:\s*string/);
    expect(content).toMatch(/TenantPublishingPurpose/);
  });
});
