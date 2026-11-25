import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const API_SRC = join(ROOT, 'src');

/** W1b — `participant_intents` may appear only in ops/migration modules (no new product HTTP). */
const PARTICIPANT_INTENT_OPS_ALLOWLIST = new Set([
  'src/lib/collections.ts',
  'src/lib/mongo-migrations.ts',
  'src/lib/participant-intents-store.ts',
  'src/lib/retired-seeking-storage-purge.ts',
  'src/lib/seeking-storage-ops.ts',
]);

const PARTICIPANT_INTENT_PATTERN = /participant_intents|participant-intent|PARTICIPANT_INTENT/i;

const collectTsUnder = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules') continue;
      out.push(...collectTsUnder(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('participant intent ops surface guard (W1b)', () => {
  it('API src references participant_intents only on ops allowlist', () => {
    const violations: string[] = [];
    for (const rel of collectTsUnder(API_SRC)) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!PARTICIPANT_INTENT_PATTERN.test(content)) continue;
      if (!PARTICIPANT_INTENT_OPS_ALLOWLIST.has(rel)) {
        violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
    expect(PARTICIPANT_INTENT_OPS_ALLOWLIST.size).toBeGreaterThanOrEqual(5);
  });
});