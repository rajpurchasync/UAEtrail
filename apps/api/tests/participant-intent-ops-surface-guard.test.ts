import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  PARTICIPANT_INTENT_OPS_ALLOWLIST,
  PARTICIPANT_INTENT_RESIDUE_PATTERN,
} from '../src/lib/participant-intent-ops-allowlist.js';

const ROOT = process.cwd();
const API_SRC = join(ROOT, 'src');

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

/** W1b/W1e — `participant_intents` may appear only in ops/migration modules (no new product HTTP). */
describe('participant intent ops surface guard (W1b/W1e)', () => {
  it('API src references participant_intents only on ops allowlist', () => {
    const violations: string[] = [];
    for (const rel of collectTsUnder(API_SRC)) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!PARTICIPANT_INTENT_RESIDUE_PATTERN.test(content)) continue;
      if (!PARTICIPANT_INTENT_OPS_ALLOWLIST.has(rel)) {
        violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
    expect(PARTICIPANT_INTENT_OPS_ALLOWLIST.size).toBeGreaterThanOrEqual(5);
  });

  it('ops allowlist entries exist under apps/api', () => {
    for (const rel of PARTICIPANT_INTENT_OPS_ALLOWLIST) {
      expect(existsSync(join(ROOT, rel)), rel).toBe(true);
    }
  });
});