import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const SCAN_ROOTS = [
  'src/explore',
  'src/list',
  'src/plan',
  'src/create',
  'apps/api/src/routes',
] as const;

const ALLOWLIST = new Set([
  'src/config/composeWireEmitGuard.test.ts',
  'src/config/composeLineageGuard.test.ts',
  'src/config/authorityMatrixGuard.test.ts',
]);

const RETIRED_COMPOSE_EMIT: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /compose=host(?:[:&]|$)/, hint: 'use activity:* compose wire' },
  { pattern: /compose=seek/, hint: 'use intent:* compose wire' },
  { pattern: /compose=add/, hint: 'use place:* compose wire' },
  { pattern: /compose=availability/, hint: 'use intent:* compose wire' },
  { pattern: /compose=wishlist/, hint: 'wishlist is POST /me/wishlist only' },
  { pattern: /`host:\$\{/, hint: 'formatComposeWire emits activity:* only' },
  { pattern: /`seek:fixed:/, hint: 'formatComposeWire emits intent:fixed:* only' },
  { pattern: /`seek:flexible/, hint: 'formatComposeWire emits intent:open only' },
  { pattern: /`add:place:/, hint: 'formatComposeWire emits place:* only' },
  { pattern: /`availability:open/, hint: 'formatComposeWire emits intent:open only' },
  { pattern: /`wishlist:/, hint: 'no wishlist compose wire' },
];

const collectTs = (dirRel: string): string[] => {
  const dir = join(ROOT, dirRel);
  const out: string[] = [];
  const walk = (dirPath: string) => {
    if (!statSync(dirPath, { throwIfNoEntry: false })?.isDirectory()) return;
    for (const entry of readdirSync(dirPath)) {
      const full = join(dirPath, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (entry === 'node_modules') continue;
        walk(full);
      } else if (
        (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
        !entry.endsWith('.test.ts') &&
        !entry.endsWith('.test.tsx')
      ) {
        out.push(relative(ROOT, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(dir);
  return out;
};

describe('composeWireEmitGuard (PR-E1)', () => {
  it('PR-E1-01: product code emits activity|place|intent only (not host/seek/add)', () => {
    const violations: string[] = [];
    for (const root of SCAN_ROOTS) {
      for (const file of collectTs(root)) {
        if (ALLOWLIST.has(file)) continue;
        const content = readFileSync(join(ROOT, file), 'utf8');
        for (const rule of RETIRED_COMPOSE_EMIT) {
          if (rule.pattern.test(content)) violations.push(`${file}: ${rule.hint}`);
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('PR-E1-02: intent open sheet is canonical (not MarkAvailabilityComposeSheet)', () => {
    expect(
      statSync(join(ROOT, 'src/explore/ui/IntentOpenComposeSheet.tsx'), { throwIfNoEntry: false })?.isFile()
    ).toBe(true);
    const composeHost = readFileSync(join(ROOT, 'src/explore/create/ComposeHost.tsx'), 'utf8');
    expect(composeHost).toMatch(/IntentOpenComposeSheet/);
    expect(composeHost).not.toMatch(/MarkAvailabilityComposeSheet/);
  });
});