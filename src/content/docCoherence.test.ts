/**
 * Regression: Tier-1 prose must not contradict wire-lexicon and shipped routes.
 * Product truth lives in code + guards (see docs/DOCS_GOVERNANCE.md § Source of truth).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
    const banned = [
      /alias `\/operator/i,
      /Alias `\/operator/i,
      /POST [`']\/operator\//,
      /is [`'`]\/operator\/\*[`'`]/,
    ];
    const legacyAllow = new Set(['DOMAIN_CANONICALS.md', 'DOMAIN.md', 'NAVIGATION.md']);
    for (const name of tier1) {
      const text = readFileSync(join(DOCS, name), 'utf8');
      for (const pattern of banned) {
        if (legacyAllow.has(name) && pattern.source.includes('operator')) continue;
        expect(pattern.test(text), `docs/${name} teaches stale /operator alias`).toBe(false);
      }
    }
  });

  it('ARCHITECTURE describes shipped HTTP (no live seeking-posts)', () => {
    const arch = readFileSync(join(DOCS, 'ARCHITECTURE.md'), 'utf8');
    expect(arch).toMatch(/\/me\/availability/);
    expect(arch).toMatch(/Trips · Venues · Crews · Chat · Plan/);
    expect(arch).not.toMatch(/seeking-posts/);
    expect(arch).toMatch(/context:map/);
  });

  it('context map generator is wired (code-first onboarding)', () => {
    expect(existsSync(join(process.cwd(), 'scripts/dev/context-map.mjs'))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.['context:map']).toMatch(/context-map/);
  });

  it('DOMAIN_CANONICALS §10 teaches getMemberStatus (not removed host-status client)', () => {
    const canon = readFileSync(join(DOCS, 'DOMAIN_CANONICALS.md'), 'utf8');
    expect(canon).toMatch(/getMemberStatus\(\)/);
    expect(canon).not.toMatch(/\| `memberApi` \| `getMemberHostStatus\(\)`/);
  });

  it('DOCS_GOVERNANCE defines terminology spine (no parallel vocab docs)', () => {
    const gov = readFileSync(join(DOCS, 'DOCS_GOVERNANCE.md'), 'utf8');
    expect(gov).toMatch(/## Terminology spine/);
    expect(gov).toMatch(/wire-lexicon\.ts/);
    expect(gov).toMatch(/upl-glossary\.ts/);
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

  it('API_ROUTING documents Discover layer recommendations and crew feed', () => {
    const routing = readFileSync(join(DOCS, 'API_ROUTING.md'), 'utf8');
    expect(routing).toMatch(/## Discover layer reads/);
    expect(routing).toMatch(/\/discover\/crew/);
    expect(routing).toMatch(/\/discover\/recommendations/);
    expect(routing).toMatch(/surface=map/);
    expect(routing).toMatch(/surface=crew/);
  });

  it('routing alignment schedule is in Tier-1 (§8.7)', () => {
    const system = readFileSync(join(DOCS, 'SYSTEM_COHERENCE.md'), 'utf8');
    expect(system).toMatch(/#### 8\.7 Routing alignment/);
    expect(system).toMatch(/MIG-ROUTING-CANON-P1/);
    expect(existsSync(join(process.cwd(), 'scripts/governance/routing-canonical-map.json'))).toBe(true);
  });

  it('experiment folder has README only (no competing plan markdown)', () => {
    const readme = readFileSync(join(DOCS, 'experiment/README.md'), 'utf8');
    expect(readme).toMatch(/Do not add plan files/i);
    const experimentDir = join(DOCS, 'experiment');
    const plans = readdirSync(experimentDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
    expect(plans).toEqual([]);
  });

  it('PCOH program spine is machine JSON (narrative sync: npm run verify:platform-governance)', () => {
    const governancePath = join(process.cwd(), 'scripts/governance/platform-governance.json');
    expect(existsSync(governancePath)).toBe(true);
    expect(existsSync(join(process.cwd(), 'scripts/platform-program.json'))).toBe(false);
    const governance = JSON.parse(readFileSync(governancePath, 'utf8'));
    const archive = JSON.parse(readFileSync(join(process.cwd(), 'scripts/governance/platform-migration-archive.json'), 'utf8'));
    expect(governance.authorization?.statement).toMatch(/PCOH|coherence program/i);
    expect(governance.authorization?.authorizedPhases).toContain('PCOH');
    expect(governance.capacity?.maxInProgressMigrations).toBe(2);
    expect((archive.migrations ?? []).some((m: { id: string }) => m.id === 'MIG-COH-00')).toBe(true);
    expect((governance.phases ?? []).some((p: { id: string }) => p.id === 'PCOH')).toBe(true);
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

  it('geography canon: Destination hub, Place kinds, activity via place site', () => {
    const canon = readFileSync(join(DOCS, 'DOMAIN_CANONICALS.md'), 'utf8');
    const domain = readFileSync(join(DOCS, 'DOMAIN.md'), 'utf8');
    expect(canon).toMatch(/### 12\.1 Geography/);
    expect(canon).toMatch(/MIG-DESTINATION-GEO-2026/);
    expect(canon).toMatch(/destinationId/);
    expect(canon).toMatch(/No `activity\.areaId` on write/);
    expect(canon).toMatch(/PlaceKind/);
    expect(domain).toMatch(/activity\.locationId.*place site/i);
  });

  it('CREATE_FLOW defers to NORTHSTAR and MEMBER_MODEL for gates', () => {
    const create = readFileSync(join(DOCS, 'CREATE_FLOW.md'), 'utf8');
    expect(create).toMatch(/NORTHSTAR/);
    expect(create).toMatch(/canPublish|\/me\/status|MEMBER_MODEL/i);
    expect(create).toMatch(/\/publishing\/\*/);
    expect(create).not.toMatch(/is [`'`]\/operator\/\*[`'`]/);
  });

  it('NORTHSTAR states anti-patterns and north-star outcomes', () => {
    const north = readFileSync(join(DOCS, 'NORTHSTAR.md'), 'utf8');
    expect(north).toMatch(/Anti-patterns/i);
    expect(north).toMatch(/trail database.*host management tool/i);
    expect(north).toMatch(/find your people|go together|get outside/i);
  });

  it('consumer detail QA gate is scripted (not experiment plan markdown)', () => {
    expect(existsSync(join(process.cwd(), 'scripts/ops/consumer-detail-manual-qa-routes.mjs'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/config/consumerDetailQaMatrixGuard.test.ts'))).toBe(
      true
    );
  });
});
