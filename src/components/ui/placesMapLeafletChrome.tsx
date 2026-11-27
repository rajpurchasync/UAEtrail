import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import L from 'leaflet';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { MAP_CONFIG } from '../../config/platform';
import type { MapRecenterTarget } from '../../lib/mapRecenter';
import {
  isLatLngInComfortableView,
  resolveListHoverMapFocus,
  sidecarFocusCenter,
} from './placesMapSidecarViewport';
import { panDeltaToShowPinWithPopup } from './placesMapPinViewport';
import type { MapBounds, PlaceMapPin } from './placesMapTypes';
import { pinMatchesSelection } from './placesMapPinIcons';

export const ProductMapInitialView = () => {
  const map = useMap();
  const didSetInitialRef = useRef(false);

  useEffect(() => {
    if (didSetInitialRef.current) return;
    didSetInitialRef.current = true;

    map.setView(
      [MAP_CONFIG.exploreDefaultCenter.lat, MAP_CONFIG.exploreDefaultCenter.lng],
      MAP_CONFIG.exploreDefaultZoom,
      { animate: false }
    );
  }, [map]);

  return null;
};

export const FitMapBounds = ({
  mapBounds,
  maxZoom,
  pinCount,
  pinsKeyValue,
}: {
  mapBounds: MapBounds;
  maxZoom: number;
  pinCount: number;
  pinsKeyValue: string;
}) => {
  const map = useMap();
  const fittedRef = useRef<string | null>(null);
  const leafletBounds = useMemo(
    () => L.latLngBounds([mapBounds.south, mapBounds.west], [mapBounds.north, mapBounds.east]),
    [mapBounds]
  );

  useEffect(() => {
    if (fittedRef.current === pinsKeyValue) return;
    fittedRef.current = pinsKeyValue;

    if (pinCount === 0) {
      map.setView([MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng], MAP_CONFIG.defaultZoom, {
        animate: false,
      });
      return;
    }

    map.fitBounds(leafletBounds, { padding: [56, 56], maxZoom, animate: false });
  }, [map, leafletBounds, maxZoom, mapBounds, pinCount, pinsKeyValue]);

  return null;
};

/** Lets explore chrome call zoomIn / zoomOut without a Leaflet control. */
export const MapReadyBridge = ({ onReady }: { onReady?: (map: L.Map | null) => void }) => {
  const map = useMap();

  useEffect(() => {
    onReady?.(map);
    return () => onReady?.(null);
  }, [map, onReady]);

  return null;
};

export const MapResize = ({ layoutRevision }: { layoutRevision?: number | string | boolean }) => {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => {
      map.invalidateSize({ animate: false });
    };

    invalidate();
    const t1 = window.setTimeout(invalidate, 100);
    const t2 = window.setTimeout(invalidate, 400);
    window.addEventListener('resize', invalidate);

    const container = map.getContainer();
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            invalidate();
          })
        : null;
    observer?.observe(container);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', invalidate);
      observer?.disconnect();
    };
  }, [map, layoutRevision]);

  return null;
};

export const RecenterMap = ({
  target,
}: {
  target: MapRecenterTarget | null;
}) => {
  const map = useMap();
  const lat = target?.lat;
  const lng = target?.lng;
  const zoom = target?.zoom;
  const zoomIn = target?.zoomIn;
  const flyDuration = target?.flyDuration;
  const nonce = target?.nonce;

  useEffect(() => {
    if (lat == null || lng == null) return;
    const duration = flyDuration ?? (zoomIn ? 1.15 : 0.65);
    if (zoomIn || zoom != null) {
      map.flyTo([lat, lng], zoomIn ? (zoom ?? MAP_CONFIG.exploreLocateZoom) : zoom!, {
        duration,
        easeLinearity: 0.2,
      });
      return;
    }
    map.panTo([lat, lng], { animate: true, duration });
  }, [map, lat, lng, zoom, zoomIn, flyDuration, nonce]);

  return null;
};

const MAP_BOUNDS_DEBOUNCE_MS = 400;

export const MapVisibleBoundsReporter = ({
  onVisibleBoundsChange,
}: {
  onVisibleBoundsChange?: (bounds: MapBounds) => void;
}) => {
  const map = useMap();
  const timerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onVisibleBoundsChange);

  useEffect(() => {
    onChangeRef.current = onVisibleBoundsChange;
  }, [onVisibleBoundsChange]);

  const report = useCallback(() => {
    if (!onChangeRef.current) return;
    const bounds = map.getBounds();
    onChangeRef.current({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    });
  }, [map]);

  const scheduleReport = useCallback(() => {
    if (!onChangeRef.current) return;
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      report();
    }, MAP_BOUNDS_DEBOUNCE_MS);
  }, [report]);

  useMapEvents({
    moveend: scheduleReport,
    zoomend: scheduleReport,
    load: report,
  });

  useEffect(() => {
    report();
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [report]);

  return null;
};

export const MapZoomReporter = ({ onZoomChange }: { onZoomChange?: (zoom: number) => void }) => {
  const map = useMap();

  useMapEvents({
    zoomend: () => onZoomChange?.(map.getZoom()),
    load: () => onZoomChange?.(map.getZoom()),
  });

  useEffect(() => {
    onZoomChange?.(map.getZoom());
  }, [map, onZoomChange]);

  return null;
};

/** Explore map — tap empty map to dismiss the pin peek (markers keep their own handlers). */
export const MapPeekDismissOnMapClick = ({ onDismiss }: { onDismiss?: () => void }) => {
  useMapEvents({
    click: () => {
      onDismiss?.();
    },
  });
  return null;
};

export const FlyToSelectedPin = ({
  pins,
  selectedExploreItemId,
}: {
  pins: PlaceMapPin[];
  selectedExploreItemId?: string;
}) => {
  const map = useMap();
  const lastPannedSelectionRef = useRef<string | null>(null);
  const pendingSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedExploreItemId) {
      lastPannedSelectionRef.current = null;
      pendingSelectionRef.current = null;
      return;
    }
    if (selectedExploreItemId !== lastPannedSelectionRef.current) {
      pendingSelectionRef.current = selectedExploreItemId;
    }
    const target = pendingSelectionRef.current;
    if (!target) return;

    const related = pins.filter((entry) => pinMatchesSelection(entry, target));
    if (related.length === 0) return;

    const focus =
      related.length >= 2
        ? sidecarFocusCenter(related.map((entry) => ({ lat: entry.latitude, lng: entry.longitude })))
        : { lat: related[0]!.latitude, lng: related[0]!.longitude };
    const point = map.latLngToContainerPoint([focus.lat, focus.lng]);
    const size = map.getSize();
    const delta = panDeltaToShowPinWithPopup(point, size);
    if (!delta) {
      lastPannedSelectionRef.current = target;
      pendingSelectionRef.current = null;
      return;
    }
    map.panBy([delta.x, delta.y], { animate: true, duration: 0.35 });
    lastPannedSelectionRef.current = target;
    pendingSelectionRef.current = null;
  }, [map, pins, selectedExploreItemId]);

  return null;
};

export const SelectedPinScreenReporter = ({
  pins,
  selectedExploreItemId,
  onChange,
}: {
  pins: PlaceMapPin[];
  selectedExploreItemId?: string;
  onChange: (point: { x: number; y: number } | null) => void;
}) => {
  const map = useMap();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const publish = useCallback(() => {
    if (!selectedExploreItemId) {
      onChangeRef.current(null);
      return;
    }
    const pin = pins.find((entry) => pinMatchesSelection(entry, selectedExploreItemId));
    if (!pin) {
      onChangeRef.current(null);
      return;
    }
    const point = map.latLngToContainerPoint([pin.latitude, pin.longitude]);
    onChangeRef.current({ x: point.x, y: point.y });
  }, [map, pins, selectedExploreItemId]);

  useMapEvents({
    move: publish,
    zoom: publish,
    moveend: publish,
    zoomend: publish,
  });

  useEffect(() => {
    publish();
    return () => onChangeRef.current(null);
  }, [publish]);

  return null;
};

/** In-memory zoom for list / guest sidecar maps (per mount, not localStorage). */
export const SidecarSessionZoom = ({
  sessionZoomRef,
}: {
  sessionZoomRef: MutableRefObject<number | null>;
}) => {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      sessionZoomRef.current = map.getZoom();
    },
  });

  useEffect(() => {
    sessionZoomRef.current = map.getZoom();
  }, [map, sessionZoomRef]);

  return null;
};

/** List side map — pan at the current zoom when hover or selection targets a pin outside the comfortable inset. */
export const SidecarMapViewportSync = ({
  pins,
  highlightedExploreItemId,
  selectedExploreItemId,
}: {
  pins: PlaceMapPin[];
  highlightedExploreItemId?: string;
  selectedExploreItemId?: string;
  sessionZoomRef: MutableRefObject<number | null>;
}) => {
  const map = useMap();

  useEffect(() => {
    const focusId = highlightedExploreItemId ?? selectedExploreItemId;
    if (!focusId) return;

    const related = pins.filter((entry) => pinMatchesSelection(entry, focusId));
    const target = resolveListHoverMapFocus(related);
    if (!target) return;
    if (isLatLngInComfortableView(map, target.lat, target.lng)) return;
    map.panTo([target.lat, target.lng], { animate: true, duration: 0.4 });
  }, [map, pins, highlightedExploreItemId, selectedExploreItemId]);

  return null;
};

const EXPLORE_DEVICE_LOCATION_ICON: L.DivIcon = L.divIcon({
  className: 'uaetrail-map-user-location',
  html: '<span class="uaetrail-map-user-location-dot" aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const MapDeviceLocationMarker = ({
  location,
}: {
  location: { lat: number; lng: number };
}) => (
  <Marker
    position={[location.lat, location.lng]}
    icon={EXPLORE_DEVICE_LOCATION_ICON}
    zIndexOffset={2500}
    interactive={false}
    keyboard={false}
    alt="Your location"
  />
);

/** Explore map behind browse drawer — pan to hovered pin only when it is outside the comfortable inset. */
export const MapHoverViewportSync = ({
  pins,
  highlightedExploreItemId,
  highlightFocus,
}: {
  pins: PlaceMapPin[];
  highlightedExploreItemId?: string;
  /** List card coordinate used when that pin is outside the loaded map window. */
  highlightFocus?: { lat: number; lng: number } | null;
}) => {
  const map = useMap();
  const focusLat = highlightFocus?.lat;
  const focusLng = highlightFocus?.lng;

  useEffect(() => {
    if (!highlightedExploreItemId) return;

    const related = pins.filter((entry) => pinMatchesSelection(entry, highlightedExploreItemId));
    const target = resolveListHoverMapFocus(
      related,
      focusLat != null && focusLng != null ? { lat: focusLat, lng: focusLng } : null
    );
    if (!target) return;
    if (isLatLngInComfortableView(map, target.lat, target.lng)) return;
    map.panTo([target.lat, target.lng], { animate: true, duration: 0.4 });
  }, [map, pins, highlightedExploreItemId, focusLat, focusLng]);

  return null;
};
