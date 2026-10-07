import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Removed from tree — see `docs/archive/README.md`. Do not resurrect full copies. */
const RETIRED_DOC_PATHS = [
  'docs/IMPLEMENTATION_GUIDE.md',
  'docs/RELEASE_READINESS.md',
  'docs/DOMAIN_ADOPTION_PLAN.md',
  'docs/ENGINEERING_PLAN.md',
];

describe('archivedDocsGuard', () => {
  it('superseded plan docs stay removed from docs/', () => {
    const present = RETIRED_DOC_PATHS.filter((rel) => existsSync(join(ROOT, rel)));
    expect(present).toEqual([]);
  });
});
