import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  HOOKS_NON_FACADE_API_ALLOWLIST,
  isHooksApiFacadeModule,
  usesDirectApiFacade,
} from './apiGuardPatterns';

const HOOKS_ROOT = join(process.cwd(), 'src', 'hooks');

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('hooksApiFacadeGuard (R8.1)', () => {
  it('only *Api / *ClientApi modules call the api facade', () => {
    const files = collectSourceFiles(HOOKS_ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (!usesDirectApiFacade(source)) continue;
      if (isHooksApiFacadeModule(file)) continue;
      if (HOOKS_NON_FACADE_API_ALLOWLIST.has(file)) {
        offenders.push(`${file} (allowlisted but must not call api — use a *ClientApi module)`);
        continue;
      }
      offenders.push(file);
    }

    expect(
      offenders,
      `api.* in src/hooks must live in *Api.ts / *ClientApi.ts facades:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
