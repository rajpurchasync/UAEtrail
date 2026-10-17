import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('terminology leak guard (FE)', () => {
  it('UPL glossary module exists', () => {
    const path = join(ROOT, 'src/content/upl-glossary.ts');
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf8')).toMatch(/UPL_PRO_MEMBERSHIP/);
  });

  it('wire-lexicon exists separately from UPL', () => {
    const path = join(ROOT, 'packages/shared-types/src/wire-lexicon.ts');
    expect(existsSync(path)).toBe(true);
    const upl = readFileSync(join(ROOT, 'src/content/upl-glossary.ts'), 'utf8');
    expect(upl).not.toMatch(/BWL_COLLECTIONS/);
  });
});
