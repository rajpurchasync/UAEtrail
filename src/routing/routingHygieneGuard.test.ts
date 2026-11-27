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

  it('does not patch history or reconcile a second location source', () => {
    expect(() => read('src/routing/routerLocationReconcile.ts')).toThrow();
    expect(() => read('src/routing/RouterDesyncDebug.tsx')).toThrow();
    expect(() => read('src/routing/useEffectiveLocation.ts')).toThrow();
    expect(() => read('src/routing/useEffectiveLocation.tsx')).toThrow();
    expect(read('src/main.tsx')).not.toMatch(/installHistoryChangeNotify/);
    expect(read('src/App.tsx')).not.toMatch(
      /AppRoutesWithLocation|EffectiveLocationProvider|RouterDesyncDebug|useProductLocation/
    );
    expect(read('src/routing/AppRoutes.tsx')).not.toMatch(/location=\{location\}/);
    expect(read('src/detail/shell/consumerDetailScrollTo.ts')).not.toMatch(/history\.replaceState/);
    expect(read('src/detail/shell/ConsumerDetailSectionJumpNav.tsx')).toMatch(/preventScrollReset/);
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
    expect(read('src/list/browse/useListDiscoveryUrlState.ts')).toMatch(/applyProductSearchMutation/);
    expect(read('src/plan/usePlanAddFlow.ts')).toMatch(/applyProductSearchMutation/);
    expect(read('src/plan/PlanPage.tsx')).toMatch(/applyProductSearchMutation/);
    expect(read('src/explore/exploreBrowseUrlSync.ts')).toMatch(/commitExploreBrowseUrlSync/);
  });

  it('does not ship bar-only compose sheet matching helpers', () => {
    expect(() => read('src/explore/ui/createIntentSheetComposeOpen.ts')).toThrow();
  });
});
