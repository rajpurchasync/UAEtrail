import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const FORBIDDEN_COMPOSE_SHIMS = [
  'src/explore/ui/demandFlow.ts',
  'src/explore/ui/seekingFlow.ts',
  'src/explore/ui/organizeFlow.ts',
  'src/explore/ui/hostingFlow.ts',
  'src/explore/exploreSeekingCatalog.ts',
];

describe('composeLineageGuard (MIG-DISCO-REG compose)', () => {
  it('COMPOSE-LINE-01: retired flow shims stay deleted', () => {
    for (const file of FORBIDDEN_COMPOSE_SHIMS) {
      expect(existsSync(join(ROOT, file))).toBe(false);
    }
  });

  it('COMPOSE-LINE-02: route hooks use availability open wizard (not flexible alias)', () => {
    expect(read('src/explore/create/hooks/useComposeRoute.ts')).toMatch(/isIntentOpenWizard/);
    expect(read('src/explore/create/composeRouteGuard.ts')).toMatch(/isIntentOpenWizard/);
    expect(read('src/explore/create/hooks/useComposeRoute.ts')).not.toMatch(
      /isAvailabilityFlexibleWizard/
    );
    expect(read('src/explore/compose.ts')).not.toMatch(/export const isAvailabilityFlexibleWizard/);
    const composeSrc = read('src/explore/compose.ts');
    expect(composeSrc).not.toMatch(/export const seekFixedCompose/);
    expect(composeSrc).not.toMatch(/export const isSeekFixedWizard/);
    expect(composeSrc).not.toMatch(/export const availabilityFlexibleCompose/);
    expect(composeSrc).not.toMatch(/export const SEEK_FIXED_COMPOSE_OPTIONS/);
    expect(composeSrc).not.toMatch(/export const SEEK_MODE_OPTIONS/);
    expect(composeSrc).not.toMatch(/export const ADD_COMPOSE_OPTIONS/);
    expect(composeSrc).not.toMatch(/export type SeekingComposeKind/);
  });

  it('COMPOSE-LINE-03: product compose emit uses intent wire (legacy parse in shared-types only)', () => {
    const compose = read('src/explore/compose.ts');
    expect(compose).toMatch(/intentFixedCompose/);
    expect(compose).toMatch(/intentOpenCompose/);
    expect(compose).not.toMatch(/intent:\s*'seeking'/);
    expect(compose).not.toMatch(/export const hostCompose/);
    expect(read('src/config/composeWireEmitGuard.test.ts')).toMatch(/PR-E1-01/);
  });

  it('COMPOSE-LINE-04: availability engine has no demand map pin or seeking post writes', () => {
    const engine = read('src/explore/ui/intentFixedFlowEngine.ts');
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
    expect(read('src/explore/create/composeFabEntry.ts')).toMatch(/composeKind: 'activity'/);
    expect(read('src/list/browse/browseListCopy.ts')).toMatch(/exploreCreateFabCopy/);
    expect(read('src/explore/composeFlowCatalog.ts')).not.toMatch(/seekingFlow/);
  });
});