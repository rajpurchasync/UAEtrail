import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

/** W1d — product TS must not compare `activityMode` to raw `seeking`. */
const ACTIVITY_MODE_SEEKING_LITERAL =
  /activityMode\s*(?:===|!==)\s*'seeking'|activityMode\s*\?\s*'[^']*'\s*:\s*[^;]*'seeking'/;

const collectProdTsUnder = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules') continue;
      out.push(...collectProdTsUnder(full));
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx')
    ) {
      out.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('retired seeking activity mode spine guard (W1d)', () => {
  it('src product code uses shared-types spine (not activityMode === seeking)', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src'))) {
      if (ACTIVITY_MODE_SEEKING_LITERAL.test(readFileSync(join(ROOT, rel), 'utf8'))) {
        violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
  });

  it('shared-types exports retired seeking activity mode helpers', () => {
    const mode = readFileSync(
      join(ROOT, 'packages/shared-types/src/explore-activity-mode.ts'),
      'utf8'
    );
    expect(mode).toMatch(/export const RETIRED_SEEKING_ACTIVITY_MODE/);
    expect(mode).toMatch(/export const isRetiredSeekingActivityModeValue/);
  });
});