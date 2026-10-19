import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = join(process.cwd(), 'docs');

const tier1 = [
  'NORTHSTAR.md',
  'CREATE_FLOW.md',
  'MEMBER_MODEL.md',
  'API_ROUTING.md',
  'DOCS_INDEX.md',
  'DOCS_GOVERNANCE.md',
  'SYSTEM_COHERENCE.md',
  'DOMAIN_CANONICALS.md',
];

describe('doc coherence (Tier 1)', () => {
  it('includes canonical index and member model', () => {
    for (const name of tier1) {
      expect(existsSync(join(DOCS, name)), `missing docs/${name}`).toBe(true);
    }
  });

  it('MEMBER_MODEL points at /me/status and inline naming vocabulary', () => {
    const member = readFileSync(join(DOCS, 'MEMBER_MODEL.md'), 'utf8');
    expect(member).toMatch(/GET \/me\/status/);
    expect(member).toMatch(/## Naming vocabulary/);
    expect(member).toMatch(/workspaceVocabulary\.ts/);
    expect(member).toMatch(/Host \(UI\)/);
    expect(member).toMatch(/profileComplete/);
  });

  it('Tier-1 docs do not teach /operator HTTP or SPA workspace alias', () => {
    const banned = [/alias `\/operator/i, /Alias `\/operator/i, /POST `\/operator\/activities`/];
    for (const name of tier1) {
      const text = readFileSync(join(DOCS, name), 'utf8');
      for (const pattern of banned) {
        expect(pattern.test(text), `docs/${name} teaches stale /operator alias`).toBe(false);
      }
    }
  });

  it('removed Tier-4 snapshots are not reintroduced at docs root', () => {
    const removed = [
      'ENGINEERING_PLAN.md',
      'DOMAIN_ADOPTION_PLAN.md',
      'IMPLEMENTATION_GUIDE.md',
      'NAMING_COHERENCE.md',
      'RELEASE_READINESS.md',
      'MEMBER_MODEL_PHASES.md',
      'MIGRATION.md',
      'PERFORMANCE_CROSS_PLATFORM_BUGFIX.md',
    ];
    for (const name of removed) {
      expect(existsSync(join(DOCS, name)), `stale doc regrowth: docs/${name}`).toBe(false);
    }
    expect(existsSync(join(DOCS, 'experiment', 'flows')), 'use CREATE_FLOW + composeFlowCatalog').toBe(
      false
    );
  });

  it('DOCS_GOVERNANCE forbids adding parallel Tier-1 docs', () => {
    const gov = readFileSync(join(DOCS, 'DOCS_GOVERNANCE.md'), 'utf8');
    expect(gov).toMatch(/Closed Tier-1/);
    expect(gov).toMatch(/do not add files/i);
  });

  it('SYSTEM_COHERENCE ties capabilities to bounded contexts', () => {
    const system = readFileSync(join(DOCS, 'SYSTEM_COHERENCE.md'), 'utf8');
    expect(system).toMatch(/Bounded contexts/i);
    expect(system).toMatch(/MEMBER_MODEL/);
    expect(system).toMatch(/src\/explore/);
  });

  it('routing alignment schedule is in Tier-1 (§8.7)', () => {
    const system = readFileSync(join(DOCS, 'SYSTEM_COHERENCE.md'), 'utf8');
    expect(system).toMatch(/#### 8\.7 Routing alignment/);
    expect(system).toMatch(/MIG-ROUTING-CANON-P1/);
    expect(existsSync(join(process.cwd(), 'scripts/routing-canonical-map.json'))).toBe(true);
  });

  it('experiment folder is stubs-only (schedule §8.8 only)', () => {
    const readme = readFileSync(join(DOCS, 'experiment/README.md'), 'utf8');
    expect(readme).toMatch(/§8\.8|8\.8/);
    const plan = readFileSync(
      join(DOCS, 'experiment/activity-detail-tabs-implementation-plan.md'),
      'utf8'
    );
    expect(plan.startsWith('> Superseded by')).toBe(true);
    expect(
      existsSync(join(DOCS, 'archive/experiment/activity-detail-tabs-implementation-plan.md'))
    ).toBe(false);
  });

  it('PCOH program spine is machine JSON (narrative sync: npm run verify:refactor-program)', () => {
    const programPath = join(process.cwd(), 'scripts/refactor-program.json');
    expect(existsSync(programPath)).toBe(true);
    const program = JSON.parse(readFileSync(programPath, 'utf8'));
    expect(program.authorization?.statement).toMatch(/PCOH|coherence program/i);
    expect(program.authorization?.authorizedPhases).toContain('PCOH');
    expect(program.capacity?.maxInProgressMigrations).toBe(2);
    expect((program.migrations ?? []).some((m: { id: string }) => m.id === 'MIG-COH-00')).toBe(true);
    expect((program.phases ?? []).some((p: { id: string }) => p.id === 'PCOH')).toBe(true);
  });

  it('SYSTEM_COHERENCE §8.8 defines sole implementation schedule', () => {
    const system = readFileSync(join(DOCS, 'SYSTEM_COHERENCE.md'), 'utf8');
    expect(system).toMatch(/### 8\.8 Coherence program 2026/);
    expect(system).toMatch(/MIG-COH-01/);
    expect(existsSync(join(process.cwd(), 'packages/shared-types/src/wire-lexicon.ts'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/content/upl-glossary.ts'))).toBe(true);
  });

  it('browse vs entity routing canon is documented in Tier-1', () => {
    const canon = readFileSync(join(DOCS, 'DOMAIN_CANONICALS.md'), 'utf8');
    const system = readFileSync(join(DOCS, 'SYSTEM_COHERENCE.md'), 'utf8');
    expect(canon).toMatch(/### 4\.1 Browse vs entity paths/);
    expect(canon).toMatch(/GET \/explore\/map/);
    expect(system).toMatch(/### 4\.1 Browse routing strategy/);
    expect(system).toMatch(/\/list/);
  });

  it('Pro storefront discovery: shop pin, guide/agency via profile surfaces', () => {
    const canon = readFileSync(join(DOCS, 'DOMAIN_CANONICALS.md'), 'utf8');
    const domain = readFileSync(join(DOCS, 'DOMAIN.md'), 'utf8');
    expect(canon).toMatch(/Pro account storefronts/);
    expect(canon).toMatch(/Do not.*emit.*agency.*explore map/i);
    expect(domain).toMatch(/No agency\/guide map pins/);
    expect(domain).toMatch(/Shops.*map pin/i);
  });

  it('geography canon: Area hub, Place kinds, activity via place.areaId', () => {
    const canon = readFileSync(join(DOCS, 'DOMAIN_CANONICALS.md'), 'utf8');
    const domain = readFileSync(join(DOCS, 'DOMAIN.md'), 'utf8');
    expect(canon).toMatch(/### 12\.1 Geography/);
    expect(canon).toMatch(/place\.areaId/);
    expect(canon).toMatch(/No `activity\.areaId` on write/);
    expect(canon).toMatch(/PlaceKind/);
    expect(domain).toMatch(/activity\.locationId.*place\.areaId/);
  });

  it('CREATE_FLOW defers to NORTHSTAR and MEMBER_MODEL for gates', () => {
    const create = readFileSync(join(DOCS, 'CREATE_FLOW.md'), 'utf8');
    expect(create).toMatch(/NORTHSTAR/);
    expect(create).toMatch(/canPublish|host-status|MEMBER_MODEL/i);
  });

  it('NORTHSTAR states anti-patterns and north-star outcomes', () => {
    const north = readFileSync(join(DOCS, 'NORTHSTAR.md'), 'utf8');
    expect(north).toMatch(/Anti-patterns/i);
    expect(north).toMatch(/trail database.*host management tool/i);
    expect(north).toMatch(/find your people|go together|get outside/i);
  });

  it('consumer detail QA gate is scripted (not experiment plan markdown)', () => {
    expect(existsSync(join(process.cwd(), 'scripts/consumer-detail-manual-qa-routes.mjs'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/config/consumerDetailQaMatrixGuard.test.ts'))).toBe(
      true
    );
  });
});
