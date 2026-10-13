import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { usesDirectApiFacade } from './apiGuardPatterns';

const CONSOLE_ROOT = join(process.cwd(), 'src', 'console');

/** R8.1 — host console UI must not call `api.*` / `apiRequest` directly. */
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

describe('consoleApiGuard (R8.1)', () => {
  it('console does not add new direct api facade usage', () => {
    const files = collectSourceFiles(CONSOLE_ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (usesDirectApiFacade(source) && !API_DOT_BASELINE.has(file)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `New api.* in src/console — move fetch to hooks/*ClientApi:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
