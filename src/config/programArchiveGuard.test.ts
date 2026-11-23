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

describe('programArchiveGuard (platform-program ledger)', () => {
  const program = JSON.parse(read('scripts/platform-program.json')) as {
    migrations?: Migration[];
    archivePolicy?: string;
  };

  it('PROG-ARCH-00: archivePolicy documented on platform-program', () => {
    expect(program.archivePolicy).toMatch(/archivedAt/);
  });

  it('PROG-ARCH-01: complete migrations have archivedAt and no path roots', () => {
    const complete = (program.migrations ?? []).filter((m) => m.status === 'complete');
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

  it('PROG-ARCH-02: touchpoint-backed programs keep scheduleDoc', () => {
    for (const id of ['MIG-PLATFORM-LAYER-SPINE', 'MIG-DISCOVER-RECOMMENDATIONS', 'MIG-PEOPLE-VOCAB-2026']) {
      const m = program.migrations?.find((row) => row.id === id);
      expect(m?.scheduleDoc, id).toBeTruthy();
    }
  });

  it('PROG-ARCH-03: verify-platform-program enforces archivedAt', () => {
    expect(read('scripts/verify-platform-program.mjs')).toMatch(/archivedAt/);
    expect(existsSync(join(ROOT, 'scripts/compact-platform-program.mjs'))).toBe(true);
  });
});