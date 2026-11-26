import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** W28+ policy — new cross-context ports use discoveryPort*, not discoverySessionExplore*. */
describe('discoveryPortNamingGuard', () => {
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