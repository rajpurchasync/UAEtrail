import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('platformTouchpointRegistryGuard (GW-4)', () => {
  const registry = JSON.parse(read('scripts/governance/platform-touchpoint-registry.json')) as {
    programs?: { programId: string; scheduleDoc: string; status: string }[];
  };

  it('REG-01: registry exists; empty when eng programs closed', () => {
    expect(Array.isArray(registry.programs)).toBe(true);
    expect((registry.programs ?? []).every((p) => p.status !== 'in_progress')).toBe(true);
  });

  it('REG-02: scheduleDoc paths exist when registry rows use .json files', () => {
    const missing: string[] = [];
    for (const row of registry.programs ?? []) {
      if (!row.scheduleDoc?.endsWith('.json')) continue;
      if (!existsSync(join(ROOT, row.scheduleDoc))) {
        missing.push(`${row.programId}: ${row.scheduleDoc}`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });
});