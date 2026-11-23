import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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

/**
 * MIG-PROGRAM-ARCHIVE — slim complete rows; path lists only on in_progress migrations.
 */
describe('programArchiveGuard (MIG-PROGRAM-ARCHIVE)', () => {
  const program = JSON.parse(read('scripts/refactor-program.json')) as {
    migrations?: Migration[];
  };

  it('PROG-ARCH-00: archive migration registered complete', () => {
    const row = program.migrations?.find((m) => m.id === 'MIG-PROGRAM-ARCHIVE');
    expect(row?.status).toBe('complete');
    expect(row?.archivedAt).toBeTruthy();
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

  it('PROG-ARCH-03: normalize script documents archive policy', () => {
    expect(read('scripts/normalize-refactor-program-archive.mjs')).toMatch(/feRoots/);
    expect(read('scripts/verify-refactor-program.mjs')).toMatch(/archivedAt/);
  });
});