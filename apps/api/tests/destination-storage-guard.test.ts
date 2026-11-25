import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const collectApiLibTs = (): string[] => {
  const root = join(ROOT, 'apps/api/src');
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
        files.push(relative(ROOT, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(root);
  return files;
};

/** MIG-DESTINATION-GEO Phase C — one Mongo story: logical DESTINATIONS → physical `areas`. */
describe('destination storage guard (Phase C)', () => {
  it('COLLECTIONS.DESTINATIONS matches BWL and aliases AREAS', () => {
    const collections = read('apps/api/src/lib/collections.ts');
    const lexicon = read('packages/shared-types/src/wire-lexicon.ts');
    expect(collections).toMatch(/DESTINATIONS: 'areas'/);
    expect(collections).toMatch(/AREAS: 'areas'/);
    expect(lexicon).toMatch(/DESTINATIONS: 'areas'/);
    expect(lexicon).toMatch(/AREAS: 'areas'/);
  });

  it('areas-store uses COLLECTIONS.DESTINATIONS', () => {
    expect(read('apps/api/src/lib/areas-store.ts')).toMatch(/COLLECTIONS\.DESTINATIONS/);
    expect(read('apps/api/src/lib/areas-store.ts')).not.toMatch(/COLLECTIONS\.AREAS/);
  });

  it('API src prefers COLLECTIONS.DESTINATIONS over COLLECTIONS.AREAS', () => {
    const violations: string[] = [];
    for (const file of collectApiLibTs()) {
      if (file === 'apps/api/src/lib/collections.ts') continue;
      const src = read(file);
      if (/\bCOLLECTIONS\.AREAS\b/.test(src)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });
});