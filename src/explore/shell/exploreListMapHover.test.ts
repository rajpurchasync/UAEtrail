import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('explore list → map pin hover', () => {
  it('wires list hover onto map pin emphasis', () => {
    const model = read('src/explore/shell/useExploreExperienceModel.ts');
    const mapShell = read('src/explore/shell/ExploreMapShell.tsx');
    const itemLink = read('src/list/browse/BrowseItemLink.tsx');
    const chrome = read('src/explore/ExploreMapChromeContext.tsx');
    const listDiscovery = read('src/list/shell/useListDiscoveryExperienceModel.ts');
    expect(model).toMatch(/highlightedExploreItemId/);
    expect(model).toMatch(/setHighlightedExploreItemId/);
    expect(mapShell).toMatch(/highlightedExploreItemId=\{highlightedExploreItemId\}/);
    expect(mapShell).toMatch(/onPrimaryFab=\{handlePrimaryFabTap\}/);
    expect(mapShell).not.toMatch(/onPrimaryFab=\{compose\.handleCreateTap\}/);
    expect(itemLink).toMatch(/setListHoverExploreItemId/);
    expect(chrome).toMatch(/subscribeListHover/);
    const mapSplit = read('src/list/shell/useListDiscoveryMapSplitModel.ts');
    expect(listDiscovery).toMatch(/setListMapHighlightedId/);
    expect(mapSplit).toMatch(/showListMapColumn/);
  });

  it('pans on list hover only when the pin is outside the comfortable viewport', () => {
    const placesMap = read('src/components/ui/PlacesMap.tsx');
    const chrome = read('src/components/ui/placesMapLeafletChrome.tsx');
    const cluster = read('src/components/ui/placesMapClusteredMarkers.tsx');
    expect(placesMap).toMatch(/placesMapLeafletChrome/);
    expect(chrome).toMatch(/SidecarMapViewportSync/);
    expect(chrome).toMatch(/MapHoverViewportSync/);
    expect(chrome).toMatch(/anyPinOutsideComfortableView/);
    expect(cluster).toMatch(/refreshClusterPinEmphasis/);
  });
});
