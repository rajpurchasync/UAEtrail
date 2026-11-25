import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

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

/** MIG-DESTINATION-GEO — one Mongo story: logical DESTINATIONS → physical `areas`. */
describe('destination storage guard (Phase C)', () => {
  it('COLLECTIONS.DESTINATIONS matches BWL', () => {
    const collections = read('apps/api/src/lib/collections.ts');
    const lexicon = read('packages/shared-types/src/wire-lexicon.ts');
    expect(collections).toMatch(/DESTINATIONS: 'areas'/);
    expect(collections).not.toMatch(/AREAS: 'areas'/);
    expect(lexicon).toMatch(/DESTINATIONS: 'areas'/);
    expect(lexicon).not.toMatch(/AREAS: 'areas'/);
  });

  it('destinations-store is the single curated-destination module', () => {
    expect(exists('apps/api/src/lib/destinations-store.ts')).toBe(true);
    expect(exists('apps/api/src/lib/areas-store.ts')).toBe(false);
    expect(read('apps/api/src/lib/destinations-store.ts')).toMatch(/COLLECTIONS\.DESTINATIONS/);
    expect(read('apps/api/src/lib/destinations-store.ts')).toMatch(/listPublishedDestinations/);
  });

  it('API src does not import areas-store or legacy area-* store paths', () => {
    const violations: string[] = [];
    const patterns = [/\bareas-store\b/, /\barea-bounds\b/, /\bseed-areas\b/];
    for (const file of collectApiLibTs()) {
      const src = read(file);
      for (const pattern of patterns) {
        if (pattern.test(src)) violations.push(`${file}: ${pattern}`);
      }
    }
    expect(violations).toEqual([]);
  });
});