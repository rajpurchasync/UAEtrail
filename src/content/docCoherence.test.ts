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

  it('MEMBER_MODEL points at host-status and inline naming vocabulary', () => {
    const member = readFileSync(join(DOCS, 'MEMBER_MODEL.md'), 'utf8');
    expect(member).toMatch(/GET \/me\/host-status/);
    expect(member).toMatch(/## Naming vocabulary/);
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

  it('consumer mobile IA keeps badges on PROFILE_BADGES_PATH (not profile-only redirect)', () => {
    const ia = readFileSync(join(DOCS, 'experiment/consumer-mobile-ia.md'), 'utf8');
    expect(ia).toMatch(/\/profile\/badges/);
    expect(ia).not.toMatch(/\/profile\/badges` redirect to \*\*`\/profile`\*\*/);
  });
});
