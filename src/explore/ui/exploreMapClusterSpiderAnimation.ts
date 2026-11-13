import L from 'leaflet';

/** Shared spiderfy timing — keep in sync with explore-map-rich CSS below. */
export const EXPLORE_MAP_CLUSTER_SPIDER_MS = 320;
export const EXPLORE_MAP_CLUSTER_SPIDER_STAGGER_MS = 36;
export const EXPLORE_MAP_CLUSTER_SPIDER_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

type PathWithLegacySvg = typeof L.Path & { SVG?: boolean };
type SpiderMarker = L.Marker & { _spiderLeg?: L.Polyline };
type PolylineWithPath = L.Polyline & { _path?: SVGPathElement };

/**
 * leaflet.markercluster 1.5.x gates stroke-dash spider legs on `L.Path.SVG`, which Leaflet 1.9 removed.
 * Without this, legs render at full length immediately (canvas-style path) while icons still CSS-animate.
 */
export const ensureLeafletMarkerClusterSvgLegs = (): void => {
  const path = L.Path as PathWithLegacySvg;
  if (path.SVG === undefined) {
    path.SVG = Boolean(L.Browser.svg);
  }
};

ensureLeafletMarkerClusterSvgLegs();

export const exploreMapClusterSpiderPolylineOptions = (): L.PolylineOptions => ({
  weight: 1.5,
  color: 'rgba(51, 65, 85, 0.52)',
  opacity: 0.5,
  className: 'leaflet-cluster-spider-leg uaetrail-map-cluster-spider-leg',
});

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const spiderLegPath = (marker: SpiderMarker): SVGPathElement | null => {
  const leg = marker._spiderLeg;
  if (!leg) return null;
  const path = (leg as PolylineWithPath)._path;
  return path instanceof SVGPathElement ? path : null;
};

const applyStaggerStyle = (el: HTMLElement | SVGElement, index: number): void => {
  const delayMs = prefersReducedMotion() ? 0 : index * EXPLORE_MAP_CLUSTER_SPIDER_STAGGER_MS;
  el.style.setProperty('--uaetrail-cluster-spider-ms', `${EXPLORE_MAP_CLUSTER_SPIDER_MS}ms`);
  el.style.setProperty('--uaetrail-cluster-spider-ease', EXPLORE_MAP_CLUSTER_SPIDER_EASE);
  el.style.setProperty('--uaetrail-cluster-spider-delay', `${delayMs}ms`);
};

/** Re-run leg stroke draw after spiderfy so each leg matches its marker stagger. */
export const syncExploreMapClusterSpiderExpand = (markers: L.Marker[]): void => {
  if (prefersReducedMotion()) return;

  markers.forEach((marker, index) => {
    const spider = marker as SpiderMarker;
    const iconEl = marker.getElement();
    if (iconEl) applyStaggerStyle(iconEl, index);

    const path = spiderLegPath(spider);
    if (!path) return;
    applyStaggerStyle(path, index);

    const length = path.getTotalLength() + 0.1;
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.style.strokeOpacity = '0';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.strokeDashoffset = '0';
        path.style.strokeOpacity = '';
        const leg = spider._spiderLeg;
        if (leg) leg.setStyle({ opacity: exploreMapClusterSpiderPolylineOptions().opacity ?? 0.5 });
      });
    });
  });
};

/** Stagger leg retract before markercluster unspiderfy runs (map click / zoom). */
export const syncExploreMapClusterSpiderCollapse = (markers: L.Marker[]): void => {
  if (prefersReducedMotion()) return;

  markers.forEach((marker, index) => {
    const spider = marker as SpiderMarker;
    const iconEl = marker.getElement();
    if (iconEl) applyStaggerStyle(iconEl, index);

    const path = spiderLegPath(spider);
    if (!path) return;
    applyStaggerStyle(path, index);

    const length = path.getTotalLength() + 0.1;
    if (!path.style.strokeDasharray) {
      path.style.strokeDasharray = `${length}`;
    }
    path.style.strokeDashoffset = '0';

    requestAnimationFrame(() => {
      path.style.strokeDashoffset = `${length}`;
      path.style.strokeOpacity = '0';
    });
  });
};

export const scheduleExploreMapClusterSpiderExpand = (markers: L.Marker[]): void => {
  requestAnimationFrame(() => {
    syncExploreMapClusterSpiderExpand(markers);
  });
};
