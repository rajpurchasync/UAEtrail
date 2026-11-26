import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** W28+ policy — cross-context ports use discoveryPortExplore/List; spine stays discoverySession*. */
describe('discoveryPortNamingGuard', () => {
  it('W29: no legacy discoverySessionExplore/List port files under src/discovery', () => {
    const root = join(process.cwd(), 'src/discovery');
    const legacy = readdirSync(root).filter(
      (f) =>
        (f.startsWith('discoverySessionExplore') || f.startsWith('discoverySessionList')) &&
        f.endsWith('.ts') &&
        !f.endsWith('.test.ts')
    );
    expect(legacy).toEqual([]);
  });

  it('W36: port suffixes avoid doubled Discover/Explore tokens', () => {
    const root = join(process.cwd(), 'src/discovery');
    const ports = readdirSync(root).filter(
      (f) => f.startsWith('discoveryPort') && f.endsWith('.ts') && !f.endsWith('.test.ts')
    );
    const suffixOf = (file: string) => file.replace(/^discoveryPort(Explore|List)/, '').replace(/\.ts$/, '');
    const hasRedundantExploreToken = (suffix: string): boolean => {
      if (/ExploreExplore|RideshareExplore/.test(suffix)) return true;
      return /(?:^|(?<=[a-z]))Explore(?=[A-Z]|$)/.test(suffix);
    };
    const violations: string[] = [];
    for (const file of ports) {
      const suffix = suffixOf(file);
      if (suffix.includes('Discovery')) violations.push(file);
      if (/Discover(?!ory)/.test(suffix)) violations.push(file);
      if (hasRedundantExploreToken(suffix)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('W28 map publish ports use discoveryPortExplore prefix', () => {
    const root = join(process.cwd(), 'src/discovery');
    const ports = [
      'discoveryPortExploreMapPin.ts',
      'discoveryPortExploreMapChrome.ts',
      'discoveryPortExploreGuest.ts',
      'discoveryPortExploreComposeGuest.ts',
      'discoveryPortExploreComposeSurface.ts',
      'discoveryPortExploreCardChrome.ts',
      'discoveryPortExploreCreateFlow.ts',
      'discoveryPortExploreNavigateHost.ts',
      'discoveryPortExploreHosting.ts',
      'discoveryPortExploreHostingPublish.ts',
      'discoveryPortExploreBrowse.ts',
      'discoveryPortExploreListChrome.ts',
      'discoveryPortExploreSearch.ts',
      'discoveryPortExploreOptionalFilters.ts',
      'discoveryPortExploreFlowChrome.ts',
      'discoveryPortExploreListCatalog.ts',
    ];
    for (const file of ports) {
      expect(existsSync(join(root, file))).toBe(true);
      expect(existsSync(join(root, file.replace('discoveryPort', 'discoverySession')))).toBe(false);
    }
  });
});