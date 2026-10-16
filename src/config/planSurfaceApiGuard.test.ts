import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { usesDirectApiFacade } from './apiGuardPatterns';

const PLAN_ROOT = join(process.cwd(), 'src', 'plan');

/** R8.1 — `/plan` route shell uses hooks; only *Routing* / *Tab* modules live here. */
const PLAN_API_DOT_ALLOWLIST = new Set<string>([]);

const collectTsx = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectTsx(full));
    } else if (entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('planSurfaceApiGuard (R8.1)', () => {
  it('src/plan route modules do not call api facade directly', () => {
    const offenders: string[] = [];
    for (const file of collectTsx(PLAN_ROOT)) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (usesDirectApiFacade(source) && !PLAN_API_DOT_ALLOWLIST.has(file)) {
        offenders.push(file);
      }
    }
    expect(
      offenders,
      `Plan route shell must use hooks — no api.* in:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('PlanPage composes hooks only (no embedded fetch)', () => {
    const page = readFileSync(join(process.cwd(), 'src/plan/PlanPage.tsx'), 'utf8');
    expect(page).toMatch(/useMemberGoals/);
    expect(page).toMatch(/useMemberStatus/);
    expect(page).not.toMatch(/\bapi\./);
  });
});
