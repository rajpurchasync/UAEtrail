import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const API_SRC = join(ROOT, 'src');

/** W1c — retired `activityMode: seeking` literal only in domain spine module. */
const RETIRED_SEEKING_LITERAL_ALLOWLIST = new Set([
  'src/domain/retired-seeking-activity-mode.ts',
]);

const SEEKING_ACTIVITY_MODE_LITERAL = /['"]seeking['"]/;

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

describe('retired seeking activity mode guard (W1c)', () => {
  it('activityMode seeking literal confined to domain spine', () => {
    const violations: string[] = [];
    for (const rel of collectTsUnder(API_SRC)) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!SEEKING_ACTIVITY_MODE_LITERAL.test(content)) continue;
      if (RETIRED_SEEKING_LITERAL_ALLOWLIST.has(rel)) continue;
      violations.push(rel);
    }
    expect(violations).toEqual([]);
  });
});