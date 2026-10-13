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

  it('browse vs entity routing canon is documented in Tier-1', () => {
    const canon = readFileSync(join(DOCS, 'DOMAIN_CANONICALS.md'), 'utf8');
    const system = readFileSync(join(DOCS, 'SYSTEM_COHERENCE.md'), 'utf8');
    expect(canon).toMatch(/### 4\.1 Browse vs entity paths/);
    expect(canon).toMatch(/GET \/explore\/map/);
    expect(system).toMatch(/### 4\.1 Browse routing strategy/);
    expect(system).toMatch(/\/list/);
  });

  it('activity detail program doc is indexed with status', () => {
    const plan = readFileSync(
      join(DOCS, 'experiment/activity-detail-tabs-implementation-plan.md'),
      'utf8'
    );
    expect(plan).toMatch(/\*\*Status:\*\* `(in_progress|complete)`/);
    expect(plan).toMatch(/activityDetailAcceptance\.test\.ts/);
    expect(plan).toMatch(/## 6\. Dynamic CTAs/);
    expect(plan).toMatch(/#### E — Host, published, \*\*with joiners\*\*/);
    const index = readFileSync(join(DOCS, 'DOCS_INDEX.md'), 'utf8');
    expect(index).toMatch(/activity-detail-tabs-implementation-plan/);
  });

  it('member plan P0 ops defers to SEEKING_STORAGE_RUNBOOK (no re-implement)', () => {
    const plan = readFileSync(
      join(DOCS, 'experiment/member-surfaces-implementation-plan.md'),
      'utf8'
    );
    expect(plan).toMatch(/Do not re-implement/);
    expect(plan).toMatch(/SEEKING_STORAGE_RUNBOOK/);
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

  it('consumer mobile IA keeps badges on PROFILE_BADGES_PATH (not profile-only redirect)', () => {
    const ia = readFileSync(join(DOCS, 'experiment/consumer-mobile-ia.md'), 'utf8');
    expect(ia).toMatch(/\/profile\/badges/);
    expect(ia).not.toMatch(/\/profile\/badges` redirect to \*\*`\/profile`\*\*/);
  });

  it('consumer detail surfaces plan records eng-complete S9 status', () => {
    const plan = readFileSync(
      join(DOCS, 'experiment/consumer-detail-surfaces-plan.md'),
      'utf8'
    );
    expect(plan).toMatch(/\*\*Status:\*\* Eng complete/);
    expect(plan).toMatch(/detail-surface-lineage-contract/);
    expect(plan).toMatch(/consumerDetailQaMatrixGuard/);
    expect(plan).toMatch(/consumerDetailAntiDriftGuard/);
    expect(plan).toMatch(/0\.2 \/ 0\.7 waived.*no Figma/i);
    expect(plan).not.toMatch(/Figma entity template.*Pending/i);
  });

  it('DOCS_INDEX Tier 3 reflects S9 eng complete (not not-started)', () => {
    const index = readFileSync(join(DOCS, 'DOCS_INDEX.md'), 'utf8');
    expect(index).toMatch(/consumer detail shells \(S9 eng complete/i);
    expect(index).not.toMatch(/consumer detail shells \(phased, not started\)/i);
    expect(index).toMatch(/consumer-detail:qa-routes/);
  });
});
