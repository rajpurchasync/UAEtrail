import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { allowedActivityPricingModes } from '@uaetrail/shared-types';

const API_SRC = join(process.cwd(), 'src');
const OPERATOR_ROUTES_DIR = join(API_SRC, 'routes', 'operator');

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
    expect(existsSync(join(OPERATOR_ROUTES_DIR, 'registerHostJoinRequestRoutes.ts'))).toBe(false);

    const hostFiles = collectTsFiles(OPERATOR_ROUTES_DIR);
    const violations: string[] = [];
    for (const file of hostFiles) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/registerHostJoinRequestRoutes/.test(content)) {
        violations.push(`${file}: use registerOperatorActivityRequestRoutes`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('operator activity routes use Activity-named registrars (not TenantActivity)', () => {
    expect(existsSync(join(OPERATOR_ROUTES_DIR, 'registerOperatorActivityRoutes.ts'))).toBe(true);
    expect(existsSync(join(OPERATOR_ROUTES_DIR, 'registerOperatorActivityParticipantRoutes.ts'))).toBe(true);
    const operatorMount = readFileSync(join(API_SRC, 'routes', 'operator.ts'), 'utf8');
    expect(operatorMount).toMatch(/registerOperatorActivityRoutes/);
    expect(operatorMount).not.toMatch(/registerHostTenantActivityRoutes/);
    expect(operatorMount).not.toMatch(/registerHostActivityRoutes/);
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

  it('API mounts publishing console on /operator only', () => {
    const index = readFileSync(join(API_SRC, 'routes', 'index.ts'), 'utf8');
    expect(index).toMatch(/apiRouter\.use\(['"]\/operator['"]/);
    expect(index).not.toMatch(/apiRouter\.use\(['"]\/host['"]/);
    expect(index).not.toMatch(/legacyHostApiRewrite/);
  });

  it('does not register parallel legacy member status routes', () => {
    expect(existsSync(join(API_SRC, 'routes', 'user', 'registerMemberHostStatusRoutes.ts'))).toBe(
      false
    );
    const routes = readFileSync(
      join(API_SRC, 'routes', 'user', 'registerMemberStatusRoutes.ts'),
      'utf8'
    );
    expect(routes).not.toMatch(/['"]\/me\/host-status['"]/);
    expect(routes).not.toMatch(/['"]\/me\/operator-status['"]/);
  });

  it('member capabilities resolver lives in member-status service only', () => {
    expect(existsSync(join(API_SRC, 'services', 'member-status.ts'))).toBe(true);
    expect(existsSync(join(API_SRC, 'services', 'member-host-status.ts'))).toBe(false);
    const status = readFileSync(join(API_SRC, 'services', 'member-status.ts'), 'utf8');
    expect(status).toMatch(/export const resolveMemberStatus/);
    expect(status).not.toMatch(/resolveMemberHostStatus/);
  });

  it('canHostPaidActivities resolver aligns with paid pricing tier gate', () => {
    const path = join(API_SRC, 'services', 'member-status.ts');
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/canHostPaidActivities\s*=\s*isPlatformAdmin\s*\|\|\s*hostTiers\.business/);
    expect(
      allowedActivityPricingModes({ community: true, professional: true, business: false }, {
        publishingProfileKind: 'pro_guide',
      })
    ).not.toContain('paid');
    expect(
      allowedActivityPricingModes({ community: false, professional: false, business: true }, {
        publishingProfileKind: 'agency',
      })
    ).toContain('paid');
    expect(
      allowedActivityPricingModes({ community: false, professional: false, business: true }, {
        publishingProfileKind: 'shop',
      })
    ).toContain('paid');
    expect(
      allowedActivityPricingModes({ community: true, professional: false, business: false }, {
        publishingProfileKind: 'agency',
      })
    ).not.toContain('paid');
  });

  it('member-host-tiers uses TenantPublishingPurpose not string', () => {
    const path = join(API_SRC, 'domain', 'member-host-tiers.ts');
    const content = readFileSync(path, 'utf8');
    expect(content).not.toMatch(/publishingPurpose\?:\s*string/);
    expect(content).toMatch(/TenantPublishingPurpose/);
  });

  it('does not use HTTP resource versioning in deprecation Link relations', () => {
    const middlewareDir = join(API_SRC, 'middleware');
    const violations: string[] = [];
    for (const file of collectTsFiles(middlewareDir)) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/successor-version/.test(content)) {
        violations.push(`${file}: use rel="alternate" only`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not reintroduce Trail Points wallet route registrars', () => {
    const userRoutes = join(API_SRC, 'routes', 'user');
    expect(existsSync(join(userRoutes, 'registerMeRewardsRoutes.ts'))).toBe(false);
    expect(existsSync(join(userRoutes, 'registerPublicRewardsRoutes.ts'))).toBe(false);
    const userRouter = readFileSync(join(API_SRC, 'routes', 'user.ts'), 'utf8');
    expect(userRouter).not.toMatch(/registerMeRewardsRoutes|registerPublicRewardsRoutes/);
    expect(userRouter).toMatch(/registerMeBadgesRoutes/);
  });
});
