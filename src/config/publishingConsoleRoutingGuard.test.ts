import { describe, expect, it } from 'vitest';
import { readAppRouteRegistry } from '../../scripts/dev/readAppRouteRegistry.mjs';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const collectTs = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue;
      out.push(...collectTs(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      out.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('publishing console routing (MIG-ROUTING-CANON-P1)', () => {
  it('API router has no legacy publishing middleware', () => {
    const index = readFileSync(join(ROOT, 'apps/api/src/routes/index.ts'), 'utf8');
    expect(index).not.toMatch(/legacyHostApiRewrite/);
    expect(index).not.toMatch(/legacyPublishingPathDeprecation/);
    expect(index).not.toMatch(/legacyMemberStatusPathRewrite/);
  });

  it('retired duplicate console stack under src/pages/operator stays deleted', () => {
    expect(existsSync(join(ROOT, 'src/pages/operator'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/hooks/useOperatorActivityManageActions.ts'))).toBe(false);
  });

  it('App mounts /operator/* console and legacy inbound redirects only', () => {
    const app = readAppRouteRegistry();
    expect(app).not.toMatch(/LegacyPublishingConsoleRedirect/);
    expect(app).toMatch(/InboundRetiredPublishingConsoleRedirect/);
    expect(app).toMatch(/path="\/host\/\*"/);
    expect(app).toMatch(/path="\/organizer\/\*"/);
    expect(app).toMatch(/path="\/publishing\/\*"/);
    expect(app).toMatch(/OPERATOR_OVERVIEW_PATH/);
    expect(app).not.toMatch(/path="\/operator\/\*".*InboundRetiredPublishingConsoleRedirect/);
    expect(app).not.toMatch(/OperatorPublishingAlias/);
    expect(app).toMatch(/path="\/publishing\/messages"/);
    expect(app).toMatch(/path="\/operator\/messages"/);
  });

  it('surfacePaths exposes operator workspace (/operator) paths', () => {
    const surface = readFileSync(join(ROOT, 'src/config/surfacePaths.ts'), 'utf8');
    expect(surface).not.toMatch(/HOST_OVERVIEW_PATH/);
    expect(surface).not.toMatch(/rewriteLegacyPublishingConsolePath/);
    expect(surface).toMatch(/OPERATOR_OVERVIEW_PATH/);
    expect(surface).toMatch(/OPERATOR_CONSOLE_PREFIX/);
    expect(surface).not.toMatch(/rewriteOperatorConsoleToPublishingPath/);
  });

  it('app src does not link to /host/ or /organizer/ publishing paths', () => {
    const allow = new Set([
      'src/App.tsx',
      'src/routing/AppRoutes.tsx',
      'src/routing/inboundBookmarkRedirects.tsx',
      'src/config/publishingConsoleRoutingGuard.test.ts',
      'src/content/workspaceProductLanguageGuard.test.ts',
      'src/member/hostMemberGuard.test.ts',
      'src/member/memberSurfacesAcceptance.test.ts',
      'src/utils/authRouting.test.ts',
      'src/utils/joinRequestActivity.ts',
      'src/utils/notificationRouting.ts',
      'src/api/domains/places.ts',
    ]);
    const violations: string[] = [];
    for (const file of collectTs(join(ROOT, 'src'))) {
      if (!file.startsWith('src/')) continue;
      if (allow.has(file) || file.endsWith('.test.ts')) continue;
      const text = readFileSync(join(ROOT, file), 'utf8');
      if (/[`'"]\/host\//.test(text) || /[`'"]\/organizer\//.test(text)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('operator console pages do not call member /me activity CRUD (O3)', () => {
    const dir = join(ROOT, 'src/pages/publishing');
    const violations: string[] = [];
    for (const file of collectTs(dir)) {
      const text = readFileSync(join(ROOT, file), 'utf8');
      if (/\/me\/activities|memberApi\.(create|update|delete)Activity/.test(text)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });
});
