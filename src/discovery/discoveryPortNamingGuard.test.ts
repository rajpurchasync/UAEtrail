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

  it('W28 map publish ports use discoveryPortExplore prefix', () => {
    const root = join(process.cwd(), 'src/discovery');
    const ports = [
      'discoveryPortExploreMapPinCopy.ts',
      'discoveryPortExploreMapPinIcons.ts',
      'discoveryPortExploreMapPinCaption.ts',
      'discoveryPortExploreMapPinTooltip.ts',
      'discoveryPortExploreMapCluster.ts',
      'discoveryPortExploreMapStyleToggle.ts',
      'discoveryPortExploreDiscoveryCardDirections.ts',
      'discoveryPortExploreNavigateHost.ts',
      'discoveryPortExploreHostingPublishTenants.ts',
    ];
    for (const file of ports) {
      expect(existsSync(join(root, file))).toBe(true);
      expect(existsSync(join(root, file.replace('discoveryPort', 'discoverySession')))).toBe(false);
    }
  });
});