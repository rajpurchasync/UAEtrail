import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOTS = [
  join(process.cwd(), 'src', 'components'),
  join(process.cwd(), 'src', 'pages'),
  join(process.cwd(), 'src', 'explore'),
  join(process.cwd(), 'src', 'utils'),
  join(process.cwd(), 'src', 'list'),
  join(process.cwd(), 'src', 'services'),
  join(process.cwd(), 'src', 'console'),
  join(process.cwd(), 'src', 'discovery'),
  join(process.cwd(), 'src', 'context'),
  join(process.cwd(), 'src', 'member'),
  join(process.cwd(), 'src', 'member-plan'),
  join(process.cwd(), 'src', 'wishlist'),
  join(process.cwd(), 'src', 'activity'),
  join(process.cwd(), 'src', 'people-discovery'),
  join(process.cwd(), 'src', 'activity-discovery'),
  join(process.cwd(), 'src', 'places-discovery'),
];

/** R8.1 — UI layers import HTTP via `src/hooks/*{Api,ClientApi}.ts`, not `api/domains/*`. */
const DOMAIN_IMPORT_BASELINE = new Set<string>([]);

const DOMAIN_IMPORT = /from ['"][^'"]*\/api\/domains\//;

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('domainImportGuard (R8.1)', () => {
  it('UI layers do not add new direct api/domains imports', () => {
    const files = SCAN_ROOTS.flatMap((root) => collectSourceFiles(root));
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (DOMAIN_IMPORT.test(source) && !DOMAIN_IMPORT_BASELINE.has(file)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `Import from src/hooks facades instead of api/domains:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
