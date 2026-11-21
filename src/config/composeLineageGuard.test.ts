import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const FORBIDDEN_COMPOSE_SHIMS = [
  'src/explore/ui/demandFlow.ts',
  'src/explore/ui/seekingFlow.ts',
  'src/explore/ui/organizeFlow.ts',
  'src/explore/ui/hostingFlow.ts',
  'src/explore/exploreSeekingCatalog.ts',
];

const collectAppTs = (dirRel: string): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (entry === 'node_modules') continue;
        walk(full);
      } else if (
        (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
        !entry.endsWith('.test.ts') &&
        !entry.endsWith('.test.tsx')
      ) {
        out.push(relative(ROOT, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(join(ROOT, dirRel));
  return out;
};

describe('composeLineageGuard (MIG-DISCO-REG compose)', () => {
  it('COMPOSE-LINE-01: retired flow shims stay deleted', () => {
    for (const file of FORBIDDEN_COMPOSE_SHIMS) {
      expect(existsSync(join(ROOT, file))).toBe(false);
    }
  });

  it('COMPOSE-LINE-02: route hooks use availability open wizard (not flexible alias)', () => {
    expect(read('src/explore/create/hooks/useComposeRoute.ts')).toMatch(/isAvailabilityOpenWizard/);
    expect(read('src/explore/create/composeRouteGuard.ts')).toMatch(/isAvailabilityOpenWizard/);
    expect(read('src/explore/create/hooks/useComposeRoute.ts')).not.toMatch(
      /isAvailabilityFlexibleWizard/
    );
    expect(read('src/explore/compose.ts')).not.toMatch(/export const isAvailabilityFlexibleWizard/);
  });

  it('COMPOSE-LINE-03: product compose emit uses availability wire (read-compat seek: in shared-types only)', () => {
    const compose = read('src/explore/compose.ts');
    expect(compose).toMatch(/availabilityFixedCompose/);
    expect(compose).toMatch(/availabilityOpenCompose/);
    expect(compose).not.toMatch(/intent:\s*'seeking'/);
    const violations: string[] = [];
    for (const file of collectAppTs('src/explore/ui')) {
      if (file.includes('availabilityFlowEngine')) continue;
      const source = read(file);
      if (/`seek:fixed:/.test(source) || /`seek:flexible`/.test(source)) {
        violations.push(`${file}: outbound seek: compose literal`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('COMPOSE-LINE-04: availability engine has no demand map pin or seeking post writes', () => {
    const engine = read('src/explore/ui/availabilityFlowEngine.ts');
    expect(engine).toMatch(/memberAvailabilityApi/);
    expect(engine).not.toMatch(/participantIntentId/);
    expect(engine).not.toMatch(/createSeekingPost/);
    expect(engine).not.toMatch(/`demand:\$\{/);
  });

  it('COMPOSE-LINE-05: compose wire does not import list projections (routing → compose stays list-free)', () => {
    const compose = read('src/explore/compose.ts');
    expect(compose).not.toMatch(/from ['"]\.\.\/list\//);
    expect(compose).toMatch(/exploreCreateFabCopy/);
  });

  it('COMPOSE-LINE-06: plan + list FAB hand off to shared compose (DMCP Phase 4)', () => {
    expect(read('src/plan/usePlanAddFlow.ts')).toMatch(/compose\.handleCreateTap/);
    expect(read('src/explore/create/composeFabEntry.ts')).toMatch(/intent: 'host'/);
    expect(read('src/list/browseListCopy.ts')).toMatch(/exploreCreateFabCopy/);
    expect(read('src/explore/composeFlowCatalog.ts')).not.toMatch(/seekingFlow/);
  });
});