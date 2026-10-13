import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { usesDirectApiFacade } from './apiGuardPatterns';

const SCAN_ROOTS = [
  join(process.cwd(), 'src', 'utils'),
  join(process.cwd(), 'src', 'list'),
  join(process.cwd(), 'src', 'services'),
];

/** R8.1 — shared app layers must not call `api.*` / `apiRequest` directly. */
const API_DOT_BASELINE = new Set<string>([]);

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

describe('utilsListApiGuard (R8.1)', () => {
  it('utils, list, and services do not add new direct api facade usage', () => {
    const files = SCAN_ROOTS.flatMap((root) => collectSourceFiles(root));
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (usesDirectApiFacade(source) && !API_DOT_BASELINE.has(file)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `New api.* — move fetch to hooks/*ClientApi:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
