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

  it('W70: list discoveryPortList* inventory locked at ten ports (C3 — feed+geo folds)', () => {
    const root = join(process.cwd(), 'src/discovery');
    const listPorts = readdirSync(root)
      .filter((f) => f.startsWith('discoveryPortList') && f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .sort();
    const expected = [
      'discoveryPortListBrowseCard.ts',
      'discoveryPortListBrowseFilters.ts',
      'discoveryPortListBrowseHooks.ts',
      'discoveryPortListEmbed.ts',
      'discoveryPortListFeed.ts',
      'discoveryPortListFindCrew.ts',
      'discoveryPortListGeoBrowse.ts',
      'discoveryPortListMapShell.ts',
      'discoveryPortListPeek.ts',
      'discoveryPortListUrl.ts',
    ];
    expect(listPorts).toEqual(expected);
  });

  it('W97: explore discoveryPortExplore inventory locked at seventeen ports', () => {
    const root = join(process.cwd(), 'src/discovery');
    const explorePorts = readdirSync(root)
      .filter((f) => f.startsWith('discoveryPortExplore') && f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .sort();
    const expected = [
      'discoveryPortExploreBrowseWire.ts',
      'discoveryPortExploreCardChrome.ts',
      'discoveryPortExploreCatalogFilters.ts',
      'discoveryPortExploreCompose.ts',
      'discoveryPortExploreComposeSurface.ts',
      'discoveryPortExploreCreateFlow.ts',
      'discoveryPortExploreFlowChrome.ts',
      'discoveryPortExploreGuest.ts',
      'discoveryPortExploreGuestWire.ts',
      'discoveryPortExploreHosting.ts',
      'discoveryPortExploreMapChrome.ts',
      'discoveryPortExploreMapClient.ts',
      'discoveryPortExploreMapPin.ts',
      'discoveryPortExploreOptionalFilters.ts',
      'discoveryPortExploreRouting.ts',
      'discoveryPortExploreSearch.ts',
      'discoveryPortExploreSearchRouting.ts',
    ];
    expect(explorePorts).toEqual(expected);
    expect(existsSync(join(root, 'discoveryPortExploreBrowse.ts'))).toBe(false);
    expect(existsSync(join(root, 'discoveryPortExploreRuntime.ts'))).toBe(false);
  });

  it('W28 map publish ports use discoveryPortExplore prefix', () => {
    const root = join(process.cwd(), 'src/discovery');
    const ports = [
      'discoveryPortExploreMapPin.ts',
      'discoveryPortExploreMapChrome.ts',
      'discoveryPortExploreGuest.ts',
      'discoveryPortExploreGuestWire.ts',
      'discoveryPortExploreCompose.ts',
      'discoveryPortExploreComposeSurface.ts',
      'discoveryPortExploreCardChrome.ts',
      'discoveryPortExploreCreateFlow.ts',
      'discoveryPortExploreHosting.ts',
      'discoveryPortExploreBrowseWire.ts',
      'discoveryPortExploreFlowChrome.ts',
      'discoveryPortExploreSearch.ts',
      'discoveryPortExploreSearchRouting.ts',
      'discoveryPortExploreOptionalFilters.ts',
      'discoveryPortExploreRouting.ts',
      'discoveryPortExploreMapClient.ts',
      'discoveryPortExploreCatalogFilters.ts',
    ];
    for (const file of ports) {
      expect(existsSync(join(root, file))).toBe(true);
      expect(existsSync(join(root, file.replace('discoveryPort', 'discoverySession')))).toBe(false);
    }
    expect(existsSync(join(root, 'discoveryPortExploreBrowse.ts'))).toBe(false);
  });
});