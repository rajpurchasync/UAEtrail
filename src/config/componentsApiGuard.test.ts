import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { usesDirectApiFacade } from './apiGuardPatterns';

const COMPONENTS_ROOT = join(process.cwd(), 'src', 'components');

/**
 * R8.1 — components must not call `api.*` / `apiRequest` directly; use pages/hooks.
 * Baseline cleared Oct 2026 — guard blocks any regression.
 */
const API_DOT_BASELINE = new Set<string>([]);

/** Low-level client helpers — prefer not to grow this set. */
const API_CLIENT_IMPORT_BASELINE = new Set<string>([]);

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

describe('componentsApiGuard (R8.1)', () => {
  it('components do not add new direct api facade usage', () => {
    const files = collectSourceFiles(COMPONENTS_ROOT);
    const offenders: string[] = [];
    const clientImportOffenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (
        /from ['"][^'"]*\/api\/client['"]/.test(source) &&
        !API_CLIENT_IMPORT_BASELINE.has(file)
      ) {
        clientImportOffenders.push(file);
      }
      if (usesDirectApiFacade(source)) {
        if (!API_DOT_BASELINE.has(file)) {
          offenders.push(file);
        }
      }
    }

    expect(clientImportOffenders, 'import api/client from components — use page/hook layer').toEqual(
      []
    );
    expect(
      offenders,
      `New api.* in src/components — move fetch to pages/hooks:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('api.* baseline in components is not growing', () => {
    const files = collectSourceFiles(COMPONENTS_ROOT);
    const current = files.filter((file) => usesDirectApiFacade(readFileSync(join(process.cwd(), file), 'utf8')));
    expect(current.length).toBeLessThanOrEqual(API_DOT_BASELINE.size);
  });
});
