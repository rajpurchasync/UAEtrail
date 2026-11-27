import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('explore map bundle split (P3)', () => {
  it('keeps App shell free of direct Leaflet imports', () => {
    const app = read('src/App.tsx');
    expect(app).not.toMatch(/PlacesMap/);
    expect(app).not.toMatch(/from 'leaflet'/);
  });

  it('loads explore-only popup CSS from map surfaces', () => {
    expect(read('src/explore/ui/ExploreExperience.tsx')).toMatch(/explore-map-chrome\.css/);
    expect(read('src/list/BrowseListPage.tsx')).toMatch(/explore-map-chrome\.css/);
    expect(read('src/index.css')).not.toMatch(/explore-desktop-popup-panel/);
  });

  it('splits map vendor chunks in vite config', () => {
    const vite = read('vite.config.ts');
    expect(vite).toMatch(/vendor-map-leaflet/);
    expect(vite).toMatch(/vendor-map-cluster/);
  });

  it('explore map shows catalog pins, not geo-tree area bubbles', () => {
    const placesMap = read('src/components/ui/PlacesMap.tsx');
    const cluster = read('src/components/ui/placesMapClusteredMarkers.tsx');
    expect(placesMap).toMatch(/placesMapClusteredMarkers/);
    expect(cluster).toMatch(/ClusteredMarkers/);
    expect(placesMap).not.toMatch(/ExploreMapGeoBubbleLayer/);
    expect(placesMap).not.toMatch(/exploreGeoBubblesForZoom/);
    expect(read('src/explore/ui/exploreMapGeoBubbles.ts')).not.toMatch(/from ['"]leaflet['"]/);
  });
});

describe('App route modularization (C2)', () => {
  it('registers routes outside App.tsx shell', () => {
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/<Routes>/);
    expect(read('src/App.tsx').split('\n').length).toBeLessThan(40);
  });
});
