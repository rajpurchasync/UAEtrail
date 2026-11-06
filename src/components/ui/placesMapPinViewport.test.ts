import { describe, expect, it } from 'vitest';
import {
  mapPinHitIconMetrics,
  mapPinLeafletIconMetrics,
  panDeltaToShowPinWithPopup,
  wrapMapPinWithGeoAnchor,
} from './placesMapPinViewport';

describe('placesMapPinViewport', () => {
  it('does not pan when the pin already sits in the popup-safe band', () => {
    expect(
      panDeltaToShowPinWithPopup({ x: 400, y: 420 }, { x: 800, y: 700 }, { topInset: 72, bottomInset: 96 })
    ).toBeNull();
  });

  it('pans without implying a zoom change when the pin is near an edge', () => {
    const delta = panDeltaToShowPinWithPopup(
      { x: 12, y: 40 },
      { x: 800, y: 700 },
      { topInset: 72, bottomInset: 96, cardReserve: 280 }
    );
    expect(delta).not.toBeNull();
    expect(delta!.x).toBeLessThan(0);
    expect(delta!.y).toBeLessThan(0);
  });

  it('expands icon metrics so near-miss taps still hit the pin', () => {
    expect(mapPinHitIconMetrics(32, 32, [16, 16])).toEqual({
      iconSize: [60, 60],
      iconAnchor: [30, 30],
    });
  });

  it('mapPinLeafletIconMetrics with zero padding keeps tight icon box', () => {
    const layout = wrapMapPinWithGeoAnchor('<span>x</span>', 32, 32, 16);
    const metrics = mapPinLeafletIconMetrics(layout, { hitPaddingPx: 0 });
    expect(metrics.iconSize).toEqual([32, 45]);
    expect(metrics.iconAnchor).toEqual([16, 45]);
    expect(metrics.html).not.toContain('uaetrail-map-pin-hit');
  });
});
