import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const assemblerPath = join(ROOT, 'src/lib/activity-read-assembler.ts');

describe('activity list pagination guard', () => {
  it('does not load all published activities with unbounded toArray for previews', () => {
    const source = readFileSync(assemblerPath, 'utf8');
    const fnStart = source.indexOf('export const listPublishedActivitiesWithPreviewsFromMongo');
    expect(fnStart).toBeGreaterThan(0);
    const fnBody = source.slice(fnStart, fnStart + 2500);
    expect(fnBody).toContain('countDocuments');
    expect(fnBody).toContain('.limit(');
    expect(fnBody).not.toMatch(/find\(\{ status: ActivityStatus\.PUBLISHED \}\)\s*\n\s*\.sort\([^)]+\)\s*\n\s*\.toArray\(\)/);
  });
});
