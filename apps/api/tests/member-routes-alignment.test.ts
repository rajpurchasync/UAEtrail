import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const apiRoot = join(process.cwd());
const feRoot = join(process.cwd(), '..', '..');

const read = (rel: string) => readFileSync(join(feRoot, rel), 'utf8');

const exportStringConst = (name: string, content: string): string | null => {
  const match = content.match(new RegExp(`export const ${name} = ['"]([^'"]+)['"]`));
  return match?.[1] ?? null;
};

const SHARED_PATH_CONSTANTS = [
  'MESSAGES_PATH',
  'HOST_MESSAGES_PATH',
  'MY_REQUESTS_PATH',
  'PROFILE_PATH',
  'PROFILE_BADGES_PATH',
  'GROUPS_PATH',
  'OPERATOR_REQUESTS_PATH',
  'OPERATOR_ACTIVITIES_PATH',
  'OPERATOR_OVERVIEW_PATH',
  'HOST_REQUESTS_PATH',
  'HOST_ACTIVITIES_PATH',
  'HOST_OVERVIEW_PATH',
  'PLAN_PATH',
  'ADMIN_USERS_PATH',
  'ADMIN_ACTIVITIES_PATH',
  'ADMIN_PLACES_PATH',
  'ADMIN_HOSTS_PATH',
] as const;

const fePathConstant = (name: string): string | null => {
  for (const file of [
    'src/config/surfacePaths.ts',
    'src/config/adminSurfacePaths.ts',
    'src/config/platform.ts',
  ]) {
    const value = exportStringConst(name, read(file));
    if (value) return value;
  }
  return null;
};

describe('member-routes alignment (API notification meta ↔ FE surfacePaths)', () => {
  it('path constants match FE routing catalog sources', () => {
    const apiRoutes = readFileSync(join(apiRoot, 'src/lib/member-routes.ts'), 'utf8');

    for (const name of SHARED_PATH_CONSTANTS) {
      expect(exportStringConst(name, apiRoutes)).toBe(fePathConstant(name));
    }
  });

  it('PRO_MEMBERSHIP_PATH matches src/config/memberRoutes.ts', () => {
    const apiRoutes = readFileSync(join(apiRoot, 'src/lib/member-routes.ts'), 'utf8');
    const memberRoutes = read('src/config/memberRoutes.ts');
    expect(exportStringConst('PRO_MEMBERSHIP_PATH', apiRoutes)).toBe(
      exportStringConst('PRO_MEMBERSHIP_PATH', memberRoutes)
    );
  });

  it('seeking explore pins use explorePublishedActivityPinPath (no exploreDemandPinPath)', () => {
    const apiRoutes = readFileSync(join(apiRoot, 'src/lib/member-routes.ts'), 'utf8');
    expect(apiRoutes).toContain('explorePublishedActivityPinPath');
    expect(apiRoutes).toContain('exploreSeekingMapItemPath');
    expect(apiRoutes).not.toMatch(/exploreDemandPinPath/);
  });
});
