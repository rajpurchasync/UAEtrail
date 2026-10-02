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

  it('MEMBER_MODEL points at host-status and naming glossary', () => {
    const member = readFileSync(join(DOCS, 'MEMBER_MODEL.md'), 'utf8');
    expect(member).toMatch(/GET \/me\/host-status/);
    expect(member).toMatch(/NAMING_HOST_MEMBER/);
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
});
