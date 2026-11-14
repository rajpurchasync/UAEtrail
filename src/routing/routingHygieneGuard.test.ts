import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

describe('routingHygieneGuard', () => {
  it('does not ship raw replaceState URL sync or aggressive router heal', () => {
    expect(read('src/App.tsx')).not.toMatch(/RouterLocationReconcile/);
    expect(() => read('src/explore/exploreSearchUrlSync.ts')).toThrow();
    expect(() => read('src/routing/RouterLocationReconcile.tsx')).toThrow();
  });

  it('installs history notify once at boot', () => {
    expect(read('src/main.tsx')).toMatch(/installHistoryChangeNotify/);
  });

  it('matches routes with reconciled product location on pathname desync', () => {
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/location=\{location\}/);
    expect(read('src/App.tsx')).toMatch(/AppRoutesWithLocation/);
  });

  it('does not rewrite legacy compose=1 on mount (canonical wire is still "1")', () => {
    const source = read('src/explore/create/hooks/useComposeRoute.ts');
    expect(source).not.toMatch(/get\(['"]compose['"]\)\s*!==\s*['"]1['"]/);
  });

  it('keeps product chrome nav on standard Link (no flushSync / preventDefault hacks)', () => {
    const source = read('src/components/navigation/ProductNavLink.tsx');
    expect(source).not.toMatch(/flushSync/);
    expect(source).not.toMatch(/preventDefault/);
  });

  it('routes explore, list, and plan query sync through applyProductSearchMutation', () => {
    expect(read('src/explore/ui/useExploreBrowseUrlState.ts')).toMatch(/commitExploreBrowseUrlSync/);
    expect(read('src/list/useListDiscoveryUrlState.ts')).toMatch(/applyProductSearchMutation/);
    expect(read('src/plan/usePlanAddFlow.ts')).toMatch(/applyProductSearchMutation/);
    expect(read('src/plan/PlanPage.tsx')).toMatch(/applyProductSearchMutation/);
    expect(read('src/explore/exploreBrowseUrlSync.ts')).toMatch(/commitExploreBrowseUrlSync/);
  });

  it('does not ship bar-only compose sheet matching helpers', () => {
    expect(() => read('src/explore/ui/createIntentSheetComposeOpen.ts')).toThrow();
  });
});
