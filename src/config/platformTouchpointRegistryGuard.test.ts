import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('platformTouchpointRegistryGuard (GW-4)', () => {
  const registry = JSON.parse(read('scripts/platform-touchpoint-registry.json')) as {
    programs?: { programId: string; scheduleDoc: string; status: string }[];
  };

  it('REG-01: active schedules registered (touchpoints or verify gate)', () => {
    const ids = new Set((registry.programs ?? []).map((p) => p.programId));
    for (const required of [
      'MIG-PLATFORM-LAYER-SPINE',
      'MIG-DISCOVER-RECOMMENDATIONS',
      'MIG-PEOPLE-VOCAB-2026',
      'MIG-PLATFORM-COMPOSE-OPERATOR-2026',
    ]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it('REG-02: touchpoint JSON files exist on disk', () => {
    const missing: string[] = [];
    for (const row of registry.programs ?? []) {
      if (!row.scheduleDoc.endsWith('.json')) continue;
      if (!existsSync(join(ROOT, row.scheduleDoc))) {
        missing.push(`${row.programId}: ${row.scheduleDoc}`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('REG-03: people vocab touchpoints programId matches registry', () => {
    const manifest = JSON.parse(read('scripts/people-vocabulary-touchpoints.json')) as { programId: string };
    const row = registry.programs?.find((p) => p.programId === manifest.programId);
    expect(row?.scheduleDoc).toBe('scripts/people-vocabulary-touchpoints.json');
  });
});