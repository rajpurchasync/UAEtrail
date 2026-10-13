import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { usesDirectApiFacade } from './apiGuardPatterns';

const CONTEXT_ROOT = join(process.cwd(), 'src', 'context');

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

describe('contextApiGuard (R8.1)', () => {
  it('context providers use hooks facades for HTTP', () => {
    const files = collectSourceFiles(CONTEXT_ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (usesDirectApiFacade(source)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `src/context must not call apiRequest / api.* — use hooks/*ClientApi:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
