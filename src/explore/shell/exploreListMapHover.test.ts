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
    const listDiscovery = read('src/list/ListDiscoveryExperience.tsx');
    const mapSplit = read('src/list/shell/useListDiscoveryMapSplitModel.ts');
    const pinModel = read('src/explore/ui/exploreMapPinModel.ts');
    expect(model).toMatch(/highlightedExploreItemId/);
    expect(model).toMatch(/setHighlightedExploreItemId/);
    expect(mapShell).toMatch(/highlightedExploreItemId=\{highlightedExploreItemId\}/);
    expect(mapShell).toMatch(/buildListHoverMapPin/);
    expect(mapShell).toMatch(/mapPinsWithListHover/);
    expect(mapShell).toMatch(/onPrimaryFab=\{handlePrimaryFabTap\}/);
    expect(mapShell).not.toMatch(/onPrimaryFab=\{compose\.handleCreateTap\}/);
    expect(itemLink).toMatch(/setListHoverExploreItemId/);
    expect(chrome).toMatch(/subscribeListHover/);
    expect(listDiscovery).toMatch(/setListMapHighlightedId/);
    expect(mapSplit).toMatch(/showListMapColumn/);
    expect(pinModel).toMatch(/resolveExploreMapItemPinCoords/);
    expect(pinModel).toMatch(/buildListHoverMapPin/);
  });

  it('pans on list hover only when the pin is outside the comfortable viewport', () => {
    const placesMap = read('src/components/ui/PlacesMap.tsx');
    const chrome = read('src/components/ui/placesMapLeafletChrome.tsx');
    const cluster = read('src/components/ui/placesMapClusteredMarkers.tsx');
    expect(placesMap).toMatch(/placesMapLeafletChrome/);
    expect(chrome).toMatch(/SidecarMapViewportSync/);
    expect(chrome).toMatch(/MapHoverViewportSync/);
    expect(chrome).toMatch(/resolveListHoverMapFocus/);
    expect(chrome).toMatch(/isLatLngInComfortableView/);
    expect(chrome).toMatch(/highlightFocus/);
    expect(read('src/list/browse/BrowseItemLink.tsx')).toMatch(/mapPoint/);
    const exploreStart = chrome.indexOf('export const MapHoverViewportSync');
    const sidecarStart = chrome.indexOf('export const SidecarMapViewportSync');
    const exploreHover = chrome.slice(exploreStart, chrome.indexOf('return null;', exploreStart));
    const sidecarHover = chrome.slice(sidecarStart, chrome.indexOf('return null;', sidecarStart));
    expect(exploreHover).toMatch(/map\.panTo\(/);
    expect(sidecarHover).toMatch(/map\.panTo\(/);
    expect(exploreHover).not.toMatch(/flyTo/);
    expect(sidecarHover).not.toMatch(/flyTo/);
    expect(cluster).toMatch(/refreshClusterPinEmphasis/);
  });
});
