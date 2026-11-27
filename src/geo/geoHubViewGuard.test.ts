import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('geo hub tabs', () => {
  it('uses geo Places/Explore tabs, not area Activities labels', () => {
    const hub = read('src/geo/GeoHubView.tsx');
    expect(hub).toMatch(/resolveGeoConsumerDetailHeaderChrome/);
    expect(hub).toMatch(/headerChrome/);
    expect(hub).toMatch(/geoHubTabsForNode/);
    expect(hub).toMatch(/useGeoPagedFacilities/);
    expect(hub).toMatch(/tab === 'facilities'/);
    expect(hub).toMatch(/tab === 'places'/);
    expect(hub).toMatch(/tab === 'explore'/);
    expect(hub).toMatch(/resolveGeoConsumerDetailHeaderChrome/);
    expect(hub).toMatch(/headerChrome/);
    expect(hub).toMatch(/GeoChildCards/);
    expect(hub).toMatch(/linkState=\{childLinkState\}/);
    expect(hub).toMatch(/showCounts=\{member\}/);
    expect(hub).toMatch(/pinDeclaredBack/);
    expect(hub).toMatch(/GeoBrowsePane/);
    expect(hub).not.toMatch(/DESTINATION_DETAIL_TABS/);
    expect(hub).not.toMatch(/activeTab === 'activities'/);
    expect(hub).not.toMatch(/GEO_HUB_TAB_LABELS\.activities/);
    expect(hub).not.toMatch(/onBucketChange=\{\(next\) => onTabChange/);
  });

  it('Explore list split is a bounded height scroll host', () => {
    const hub = read('src/geo/GeoHubView.tsx');
    const exploreBlock = hub.slice(hub.indexOf("tab === 'explore'"));
    expect(exploreBlock).toMatch(/flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden/);
    expect(read('src/geo/GeoBrowsePane.tsx')).toMatch(
      /flex h-0 min-h-0 min-w-0 flex-1 flex-row overflow-hidden/
    );
    const explorer = read('src/list/explorer/ListExplorer.tsx');
    expect(explorer).toMatch(/APP_SCROLL_BODY_CLASS/);
    expect(explorer).toMatch(/min-h-0[\s\S]{0,64}flex-1 overflow-y-auto/);
    expect(explorer).not.toMatch(/scrollbar-hide/);
    const css = read('src/index.css');
    expect(css).toMatch(/\.list-explorer-scroll\s*\{/);
    expect(css).toMatch(/\.list-explorer-scroll::-webkit-scrollbar\s*\{/);
    expect(css).not.toMatch(/\.list-explorer-scroll[\s\S]{0,400}scrollbar-width:\s*none/);
  });

  it('Places tab is child-geo links only — Browse stays on Explore', () => {
    const hub = read('src/geo/GeoHubView.tsx');
    const placesStart = hub.indexOf("{tab === 'places'");
    const facilitiesStart = hub.indexOf("{tab === 'facilities'");
    const placesBlock = hub.slice(placesStart, facilitiesStart);
    expect(placesBlock).toMatch(/GeoChildCards/);
    expect(placesBlock).not.toMatch(/GeoBrowsePane/);
    const exploreBlock = hub.slice(hub.indexOf("tab === 'explore'"));
    expect(exploreBlock).toMatch(/GeoBrowsePane/);
    expect(exploreBlock).not.toMatch(/GeoChildCards/);
  });

  it('legacy tab=activities maps to explore on geo hubs only', () => {
    const tab = read('src/geo/geoHubTab.ts');
    expect(tab).toMatch(/value === 'activities'\) return 'explore'/);
    expect(read('src/geo/useGeoDetailTab.ts')).toMatch(/parseGeoHubTabParam/);
    expect(read('src/destinationDetail/destinationDetailTab.ts')).toMatch(/'overview', 'places', 'activities'/);
  });
});
