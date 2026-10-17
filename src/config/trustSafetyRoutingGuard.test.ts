import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('trust & safety routing (MIG-ROUTING-CANON-P4)', () => {
  it('API mounts member reports at POST /safety/reports', () => {
    const index = readFileSync(join(ROOT, 'apps/api/src/routes/index.ts'), 'utf8');
    expect(index).toMatch(/apiRouter\.use\('\/safety', safetyRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/reports', reportsRouter\)/);

    const safety = readFileSync(join(ROOT, 'apps/api/src/routes/safety.ts'), 'utf8');
    expect(safety).toMatch(/\.post\('\/reports'/);
  });

  it('safetyApi owns content reports — leftover social facade is gone', () => {
    expect(existsSync(join(ROOT, 'src/api/domains/social.ts'))).toBe(false);

    const safety = readFileSync(join(ROOT, 'src/api/domains/safety.ts'), 'utf8');
    expect(safety).toMatch(/\/safety\/reports/);
    expect(safety).toMatch(/submitContentReport/);
  });
});
