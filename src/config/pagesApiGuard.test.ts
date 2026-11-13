import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { usesDirectApiFacade } from './apiGuardPatterns';

const PAGES_ROOT = join(process.cwd(), 'src', 'pages');

/** R8.1 — pages must not call `api.*` / `apiRequest` directly; use hooks *ClientApi / *Api facades. */
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

describe('pagesApiGuard (R8.1)', () => {
  it('pages do not add new direct api facade usage', () => {
    const files = collectSourceFiles(PAGES_ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (usesDirectApiFacade(source) && !API_DOT_BASELINE.has(file)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `New api.* in src/pages — move fetch to hooks/*ClientApi:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('api.* baseline in pages is not growing', () => {
    const files = collectSourceFiles(PAGES_ROOT);
    const current = files.filter((file) =>
      usesDirectApiFacade(readFileSync(join(process.cwd(), file), 'utf8'))
    );
    expect(current.length).toBeLessThanOrEqual(API_DOT_BASELINE.size);
  });

  it('admin pages load data via hooks facades (R8.1)', () => {
    const adminPages = collectSourceFiles(join(PAGES_ROOT, 'admin')).filter((file) =>
      file.endsWith('.tsx')
    );
    expect(adminPages.length).toBeGreaterThanOrEqual(10);

    for (const file of adminPages) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      const facadePattern = file.endsWith('admin/Notifications.tsx')
        ? /notificationInboxApi/
        : file.endsWith('admin/Alerts.tsx')
          ? /adminAlertsClientApi/
          : file.endsWith('admin/Submissions.tsx')
            ? /geoHierarchyClientApi/
            : file.endsWith('admin/Overview.tsx')
              ? /adminConsoleApi|Inbox/
              : /adminConsoleApi/;
      expect(source, `${file} must import hooks facade`).toMatch(facadePattern);
      expect(source, `${file} must not call api.*`).not.toMatch(/\bapi\./);
    }
  });
});
