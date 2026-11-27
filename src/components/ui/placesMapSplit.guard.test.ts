import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('PlacesMap split (R5 god-file)', () => {
  it('keeps explore shell under ~550 lines and delegates clustering', () => {
    const placesMap = read('src/components/ui/PlacesMap.tsx');
    expect(placesMap).toMatch(/placesMapClusteredMarkers/);
    expect(placesMap).toMatch(/placesMapPinIcons/);
    expect(placesMap).toMatch(/placesMapLeafletChrome/);
    expect(placesMap).not.toMatch(/iconCreateFunction/);
    expect(placesMap.split(/\r?\n/).length).toBeLessThan(550);
  });

  it('isolates imperative cluster layer in placesMapClusteredMarkers', () => {
    const cluster = read('src/components/ui/placesMapClusteredMarkers.tsx');
    expect(cluster).toMatch(/markerClusterGroup/);
    expect(cluster).toMatch(/refreshClusterPinEmphasis/);
  });

  it('keeps pin icon builders in placesMapPinIcons', () => {
    const pinIcons = read('src/components/ui/placesMapPinIcons.ts');
    expect(pinIcons).toMatch(/export const pinIcon/);
    expect(pinIcons).toMatch(/export const clusterCollidedLeafIcon/);
    expect(pinIcons).not.toMatch(/useMap\(/);
  });
});