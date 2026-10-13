import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CONSOLE_ROOT = join(process.cwd(), 'src', 'console');

/** R8.1 — host console UI uses `api/types` for DTOs, not the `api` facade barrel. */
const API_INDEX_IMPORT = /from ['"][^'"]*\/api(?:\/index)?['"]/;

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

describe('consoleApiIndexGuard (R8.1)', () => {
  it('console does not import from api/index', () => {
    const files = collectSourceFiles(CONSOLE_ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (API_INDEX_IMPORT.test(source)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `Use src/hooks/*Api or src/api/types — not api/index:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
