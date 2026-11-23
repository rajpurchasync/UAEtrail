import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

type Migration = {
  id: string;
  status: string;
  archivedAt?: string;
  feRoots?: string[];
  apiRoots?: string[];
  executionPhases?: string[];
  scheduleDoc?: string;
};

describe('programArchiveGuard (GW-4 migration ledger)', () => {
  const governance = JSON.parse(read('scripts/platform-governance.json')) as { archivePolicy?: string };
  const archive = JSON.parse(read('scripts/platform-migration-archive.json')) as { migrations?: Migration[] };
  const registry = JSON.parse(read('scripts/platform-touchpoint-registry.json')) as {
    programs?: { programId: string; scheduleDoc: string }[];
  };

  it('PROG-ARCH-00: archivePolicy documented on platform-governance', () => {
    expect(governance.archivePolicy).toMatch(/touchpoint-registry/i);
  });

  it('PROG-ARCH-01: complete migrations have archivedAt and no path roots', () => {
    const complete = (archive.migrations ?? []).filter((m) => m.status === 'complete');
    expect(complete.length).toBeGreaterThan(10);
    const violations: string[] = [];
    for (const m of complete) {
      if (!m.archivedAt) violations.push(`${m.id}: missing archivedAt`);
      if (m.feRoots?.length) violations.push(`${m.id}: feRoots must be removed`);
      if (m.apiRoots?.length) violations.push(`${m.id}: apiRoots must be removed`);
      if (m.executionPhases?.length) violations.push(`${m.id}: executionPhases must be removed`);
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('PROG-ARCH-02: touchpoint-backed programs keep scheduleDoc in registry', () => {
    for (const id of ['MIG-PLATFORM-LAYER-SPINE', 'MIG-DISCOVER-RECOMMENDATIONS', 'MIG-PEOPLE-VOCAB-2026']) {
      const row = registry.programs?.find((p) => p.programId === id);
      expect(row?.scheduleDoc, id).toBeTruthy();
    }
  });

  it('PROG-ARCH-03: verify-platform-governance enforces archivedAt', () => {
    expect(read('scripts/verify-platform-governance.mjs')).toMatch(/archivedAt/);
    expect(existsSync(join(ROOT, 'scripts/platform-migration-archive.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/platform-program.json'))).toBe(false);
  });
});