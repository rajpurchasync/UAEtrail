import L from 'leaflet';
import { describe, expect, it } from 'vitest';
import {
  ensureLeafletMarkerClusterSvgLegs,
  exploreMapClusterSpiderPolylineOptions,
} from './exploreMapClusterSpiderAnimation';

describe('exploreMapClusterSpiderAnimation', () => {
  it('restores L.Path.SVG for leaflet.markercluster stroke-dash legs', () => {
    const path = L.Path as typeof L.Path & { SVG?: boolean };
    delete path.SVG;
    ensureLeafletMarkerClusterSvgLegs();
    expect(path.SVG).toBe(Boolean(L.Browser.svg));
  });

  it('tags spider legs for explore map chrome', () => {
    const options = exploreMapClusterSpiderPolylineOptions();
    expect(options.className).toContain('leaflet-cluster-spider-leg');
    expect(options.className).toContain('uaetrail-map-cluster-spider-leg');
  });
});
