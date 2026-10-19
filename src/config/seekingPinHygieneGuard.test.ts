import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

/**
 * Seeking pins are `activity:{id}` only — leftover `pin=demand:` is not a product path.
 */
const PIN_DEMAND_LITERAL_ALLOWLIST = new Set(['src/config/seekingPinHygieneGuard.test.ts']);

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx')
    ) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('seekingPinHygieneGuard (R4 exit)', () => {
  it('app code does not embed pin=demand:', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      if (PIN_DEMAND_LITERAL_ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (content.includes('pin=demand:')) {
        violations.push(file);
      }
    }

    expect(
      violations,
      `Leftover pin=demand: is not a product path:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('S12d: removed leftover seeking peek flags from app code', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];
    const leftoverPeekFlag = /showLegacySeeking(?:OwnerPeek|LinkRideshare)/;

    for (const file of files) {
      if (file === 'src/config/seekingPinHygieneGuard.test.ts') continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (leftoverPeekFlag.test(content)) {
        violations.push(file);
      }
    }

    expect(
      violations,
      `Map peek uses activity wire only — no showLegacySeeking* flags:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('S12d: no removed intent-only peek modules under explore/ui', () => {
    const files = collectSourceFiles(join(SCAN_ROOT, 'explore', 'ui'));
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (
        content.includes('ActivityPeekHostManageActions') ||
        content.includes('ActivityPeekLegacyIntentJoinActions')
      ) {
        violations.push(file);
      }
    }

    expect(violations, `Intent-only map peek removed from explore/ui:\n${violations.join('\n')}`).toEqual(
      []
    );
  });
});
