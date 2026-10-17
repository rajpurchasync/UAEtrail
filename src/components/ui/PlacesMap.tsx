import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { formatActivityType } from '../../utils/activityIdentity';
import { MAP_CONFIG } from '../../config/platform';
import { exploreMapPinRingColor, type MapPinRingSource } from '../../config/exploreTheme';
import { HIKING_VENUE_EMOJI, CAMPING_VENUE_EMOJI, CAMPING_ACTIVITY_EMOJI, MAP_FILTER_EMOJI } from '../../explore/exploreCopy';
import {
  buildMapPinFaceHtml,
  buildMapClusterIconHtml,
  buildMapColocatedPinIconHtml,
  buildVenueMapPinHtml,
  isCatalogVenueMapPin,
  resolveColocatedExploreItemIdFromPointer,
  type ColocatedPinIconEntry,
} from '../../explore/mapPinIcons';
import { MapTileLayers } from './MapTileLayers';
import type { MapPinKind, MapPinSource } from './mapPinTypes';

export type { MapPinKind, MapPinSource };

const toMapPinRingSource = (source: MapPinSource, seeking: boolean): MapPinRingSource | undefined => {
  if (seeking) return 'seeking';
  switch (source) {
    case 'activity':
      return 'activity';
    case 'venue':
      return 'venue';
    case 'shop':
      return 'shop';
    case 'agency':
      return 'agency';
    case 'demand':
      return 'demand';
    case 'area':
      return 'venue';
    default:
      return undefined;
  }
};

export interface PlaceMapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  activityType: MapPinKind;
  path: string;
  hostAvatar?: string | null;
  source?: MapPinSource;
  activityMode?: 'hosted' | 'seeking';
  /** Base explore item id when this pin is a carpool endpoint. */
  exploreItemId?: string;
  rideshareEndpoint?: 'from' | 'to';
  /** Same map icon + location; tap opens the first unless one is already selected. */
  stackExploreItemIds?: string[];
  stackCount?: number;
  /** Multiple emoji types at one coordinate — rendered as one Leaflet marker. */
  colocatedEntries?: ColocatedMapPinEntry[];
  /** Amenity catalog kind when `activityType` is `event`. */
  placeKind?: import('@uaetrail/shared-types').PlaceKind;
}

export interface ColocatedMapPinEntry {
  activityType: MapPinKind;
  source?: MapPinSource;
  activityMode?: 'hosted' | 'seeking';
  exploreItemId: string;
  stackExploreItemIds?: string[];
  stackCount?: number;
}

export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

const padBounds = (bounds: MapBounds, padding = 0.08): MapBounds => ({
  west: bounds.west - padding,
  south: bounds.south - padding,
  east: bounds.east + padding,
  north: bounds.north + padding,
});

const boundsFromPins = (pins: PlaceMapPin[], fallback: MapBounds): MapBounds => {
  if (pins.length === 0) return fallback;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const pin of pins) {
    west = Math.min(west, pin.longitude);
    south = Math.min(south, pin.latitude);
    east = Math.max(east, pin.longitude);
    north = Math.max(north, pin.latitude);
  }

  const lngSpan = Math.max(east - west, 0.02);
  const latSpan = Math.max(north - south, 0.02);

  return padBounds(
    {
      west: west - lngSpan * 0.12,
      south: south - latSpan * 0.12,
      east: east + lngSpan * 0.12,
      north: north + latSpan * 0.12,
    },
    0
  );
};

const resolvePinSource = (pin: Pick<PlaceMapPin, 'id' | 'source'>): MapPinSource => {
  if (pin.id.startsWith('area:')) return 'area';
  if (pin.id.startsWith('venue:')) return 'venue';
  if (pin.id.startsWith('demand:')) return 'demand';
  if (pin.id.startsWith('shop:')) return 'shop';
  if (pin.id.startsWith('agency:')) return 'agency';
  if (
    pin.source === 'activity' ||
    pin.source === 'venue' ||
    pin.source === 'shop' ||
    pin.source === 'agency' ||
    pin.source === 'demand' ||
    pin.source === 'area'
  ) {
    return pin.source;
  }
  return 'activity';
};

const pinIcon = (
  kind: MapPinKind,
  selected: boolean,
  pin: Pick<
    PlaceMapPin,
    'id' | 'name' | 'source' | 'stackCount' | 'colocatedEntries' | 'activityMode' | 'placeKind'
  >,
  _rideshareEndpoint?: 'from' | 'to',
  selectedExploreItemId?: string,
  mapZoom: number = MAP_CONFIG.exploreDefaultZoom,
  highlightedExploreItemId?: string
): L.DivIcon => {
  if (pin.colocatedEntries && pin.colocatedEntries.length > 0) {
    const entries = pin.colocatedEntries.map((entry) => {
      const source = entry.source ?? 'activity';
      const entrySelected =
        (Boolean(selectedExploreItemId) &&
          (entry.stackExploreItemIds?.includes(selectedExploreItemId!) ||
            entry.exploreItemId === selectedExploreItemId)) ||
        (Boolean(highlightedExploreItemId) &&
          (entry.stackExploreItemIds?.includes(highlightedExploreItemId!) ||
            entry.exploreItemId === highlightedExploreItemId));
      return {
        kind: entry.activityType,
        source,
        ringColor: exploreMapPinRingColor(
          entry.activityType,
          toMapPinRingSource(source, entry.activityMode === 'seeking')
        ),
        exploreItemId: entry.exploreItemId,
        stackCount: entry.stackCount ?? 1,
        selected: entrySelected,
        activityMode: entry.activityMode ?? null,
      };
    });
    const { html, size } = buildMapColocatedPinIconHtml(entries);
    return L.divIcon({
      className: 'uaetrail-map-pin',
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2 - 4],
    });
  }

  const source = resolvePinSource(pin);
  if (source === 'area' || kind === 'area') {
    const layout = buildVenueMapPinHtml({
      kind: 'event',
      label: pin.name,
      mapZoom,
      selected,
      stackCount: pin.stackCount,
    });
    return L.divIcon({
      className: 'uaetrail-map-pin uaetrail-map-venue-pin-wrap uaetrail-map-area-pin-wrap',
      html: layout.html,
      iconSize: [layout.width, layout.height],
      iconAnchor: layout.iconAnchor,
      popupAnchor: [0, -layout.iconAnchor[1] - 4],
    });
  }
  if (isCatalogVenueMapPin(kind, source)) {
    const layout = buildVenueMapPinHtml({
      kind,
      label: pin.name,
      mapZoom,
      selected,
      stackCount: pin.stackCount,
    });
    return L.divIcon({
      className: 'uaetrail-map-pin uaetrail-map-venue-pin-wrap',
      html: layout.html,
      iconSize: [layout.width, layout.height],
      iconAnchor: layout.iconAnchor,
      popupAnchor: [0, -layout.iconAnchor[1] - 4],
    });
  }

  const ringColor = exploreMapPinRingColor(
    kind,
    pin.activityMode === 'seeking' ? 'seeking' : source
  );
  const isVenue = source === 'venue';
  const size = isVenue ? (selected ? 36 : 32) : selected ? 36 : 32;
  const iconSize = isVenue ? 15 : 18;
  const ringWidth = selected ? 3 : 2.5;
  const stackCount = pin.stackCount ?? 0;
  const html = buildMapPinFaceHtml({
    kind,
    source,
    ringColor,
    size,
    fontSizePx: iconSize,
    ringWidth,
    selected,
    stackCount,
    activityMode: pin.activityMode ?? null,
    placeKind: pin.placeKind,
    exploreItemId: pin.exploreItemId ?? pin.id,
  });

  return L.divIcon({
    className: 'uaetrail-map-pin',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

type MarkerWithPin = L.Marker & { options: L.MarkerOptions & { uaetrailPin?: PlaceMapPin } };

const pinsFromCluster = (cluster: L.MarkerCluster): PlaceMapPin[] => {
  const childMarkers = cluster.getAllChildMarkers() as MarkerWithPin[];
  const collected: PlaceMapPin[] = [];
  for (const marker of childMarkers) {
    const pin = marker.options.uaetrailPin;
    if (pin) collected.push(pin);
  }
  return collected;
};

const pinMatchesSelection = (pin: PlaceMapPin, selectedExploreItemId?: string): boolean => {
  if (!selectedExploreItemId) return false;
  if (pin.colocatedEntries?.length) {
    return pin.colocatedEntries.some(
      (entry) =>
        entry.exploreItemId === selectedExploreItemId ||
        entry.stackExploreItemIds?.includes(selectedExploreItemId)
    );
  }
  if (pin.stackExploreItemIds?.includes(selectedExploreItemId)) return true;
  return (
    pin.id === selectedExploreItemId ||
    (pin.exploreItemId != null && pin.exploreItemId === selectedExploreItemId)
  );
};

const pinForExploreItemClick = (pin: PlaceMapPin, exploreItemId: string): PlaceMapPin => ({
  ...pin,
  exploreItemId,
  stackExploreItemIds:
    pin.colocatedEntries?.find(
      (entry) =>
        entry.exploreItemId === exploreItemId || entry.stackExploreItemIds?.includes(exploreItemId)
    )?.stackExploreItemIds ?? pin.stackExploreItemIds,
});

const pinMatchesExploreItemId = (pin: PlaceMapPin, exploreItemId: string): boolean => {
  if (pin.colocatedEntries?.length) {
    return pin.colocatedEntries.some(
      (entry) =>
        entry.exploreItemId === exploreItemId || entry.stackExploreItemIds?.includes(exploreItemId)
    );
  }
  return (
    pin.exploreItemId === exploreItemId ||
    pin.id === exploreItemId ||
    Boolean(pin.stackExploreItemIds?.includes(exploreItemId))
  );
};

const resolvePinForExploreItemId = (
  pins: PlaceMapPin[],
  exploreItemId: string
): PlaceMapPin | null => {
  for (const pin of pins) {
    if (!pinMatchesExploreItemId(pin, exploreItemId)) continue;
    if (pin.colocatedEntries?.length) return pinForExploreItemClick(pin, exploreItemId);
    return { ...pin, exploreItemId };
  }
  return null;
};

const colocatedIconRootFromEvent = (event?: L.LeafletMouseEvent): HTMLElement | null => {
  const target = event?.originalEvent?.target as HTMLElement | null;
  if (!target) return null;
  return (
    target.closest('.uaetrail-map-pin-multi') ??
    target.closest('.leaflet-marker-icon') ??
    target.closest('.uaetrail-map-cluster-wrap')
  );
};

const exploreItemIdFromMapPointer = (
  pin: PlaceMapPin,
  event?: L.LeafletMouseEvent
): string | null => {
  const target = (event?.originalEvent?.target as HTMLElement | null)?.closest?.('[data-explore-item-id]');
  const fromTarget = target?.getAttribute('data-explore-item-id');
  if (fromTarget) return fromTarget;

  const entries = pin.colocatedEntries;
  if (!entries?.length || !event?.originalEvent) return null;

  const iconRoot = colocatedIconRootFromEvent(event);
  if (!iconRoot) return null;

  const rect = iconRoot.getBoundingClientRect();
  const x = event.originalEvent.clientX - rect.left;
  const y = event.originalEvent.clientY - rect.top;
  return resolveColocatedExploreItemIdFromPointer(entries, x, y, rect.width, rect.height);
};

const resolvePinClick = (pin: PlaceMapPin, event?: L.LeafletMouseEvent): PlaceMapPin => {
  const itemId = exploreItemIdFromMapPointer(pin, event);
  if (itemId && pin.colocatedEntries?.length) {
    return pinForExploreItemClick(pin, itemId);
  }
  return pin;
};

const resolveClusterMapClick = (
  clusterPins: PlaceMapPin[],
  event: L.LeafletMouseEvent,
  selectedExploreItemId?: string,
  highlightedExploreItemId?: string
): PlaceMapPin | null => {
  const target = (event.originalEvent?.target as HTMLElement | null)?.closest?.('[data-explore-item-id]');
  const fromTarget = target?.getAttribute('data-explore-item-id');
  if (fromTarget) return resolvePinForExploreItemId(clusterPins, fromTarget);

  const iconRoot = colocatedIconRootFromEvent(event);
  const pointerEntries =
    clusterPins.find((pin) => (pin.colocatedEntries?.length ?? 0) > 1)?.colocatedEntries ??
    aggregateClusterPinEntries(clusterPins, selectedExploreItemId, highlightedExploreItemId);

  if (pointerEntries.length > 1 && iconRoot) {
    const rect = iconRoot.getBoundingClientRect();
    const x = event.originalEvent.clientX - rect.left;
    const y = event.originalEvent.clientY - rect.top;
    const itemId = resolveColocatedExploreItemIdFromPointer(
      pointerEntries,
      x,
      y,
      rect.width,
      rect.height
    );
    if (itemId) return resolvePinForExploreItemId(clusterPins, itemId);
  }

  if (clusterPins.length === 1) return resolvePinClick(clusterPins[0]!, event);
  return null;
};

const markerZIndex = (
  pin: PlaceMapPin,
  selectedExploreItemId?: string,
  highlightedExploreItemId?: string
): number => {
  if (pinMatchesSelection(pin, selectedExploreItemId)) return 1000;
  if (highlightedExploreItemId && pinMatchesSelection(pin, highlightedExploreItemId)) return 800;
  if (pin.source === 'activity') return 500;
  if (pin.source === 'shop' || pin.source === 'agency') return 250;
  return 0;
};

const isPinEmphasized = (
  pin: PlaceMapPin,
  selectedExploreItemId?: string,
  highlightedExploreItemId?: string
): boolean =>
  pinMatchesSelection(pin, selectedExploreItemId) ||
  (highlightedExploreItemId != null && pinMatchesSelection(pin, highlightedExploreItemId));

/** Sum indicative counts per map icon (type + source) for cluster / badge rendering. */
const aggregateClusterPinEntries = (
  clusterPins: PlaceMapPin[],
  selectedExploreItemId?: string,
  highlightedExploreItemId?: string
): ColocatedPinIconEntry[] => {
  type Bucket = ColocatedPinIconEntry & { count: number };
  const buckets = new Map<string, Bucket>();

  const add = (
    kind: MapPinKind,
    source: MapPinSource,
    exploreItemId: string,
    addCount: number,
    selected: boolean
  ) => {
    const key = `${kind}:${source}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += addCount;
      if (selected) existing.selected = true;
      return;
    }
    buckets.set(key, {
      kind,
      source,
      ringColor: exploreMapPinRingColor(kind, toMapPinRingSource(source, false)),
      exploreItemId,
      stackCount: addCount,
      count: addCount,
      selected,
    });
  };

  for (const pin of clusterPins) {
    if (pin.colocatedEntries?.length) {
      for (const entry of pin.colocatedEntries) {
        const source = entry.source ?? 'activity';
        const count = entry.stackCount ?? 1;
        const entrySelected =
          (Boolean(selectedExploreItemId) &&
            (entry.stackExploreItemIds?.includes(selectedExploreItemId!) ||
              entry.exploreItemId === selectedExploreItemId)) ||
          (Boolean(highlightedExploreItemId) &&
            (entry.stackExploreItemIds?.includes(highlightedExploreItemId!) ||
              entry.exploreItemId === highlightedExploreItemId));
        add(entry.activityType, source, entry.exploreItemId, count, entrySelected);
      }
      continue;
    }

    const source = resolvePinSource(pin);
    const count = pin.stackCount ?? 1;
    add(
      pin.activityType,
      source,
      pin.exploreItemId ?? pin.id,
      count,
      isPinEmphasized(pin, selectedExploreItemId, highlightedExploreItemId)
    );
  }

  return [...buckets.values()].map(({ kind, source, ringColor, exploreItemId, count, selected }) => ({
    kind,
    source,
    ringColor,
    exploreItemId,
    stackCount: count,
    selected,
  }));
};

const pinsKey = (pins: PlaceMapPin[]): string =>
  pins
    .map((pin) => pin.id)
    .sort()
    .join('|');

const ExploreInitialView = ({ pinsKeyValue, pinCount }: { pinsKeyValue: string; pinCount: number }) => {
  const map = useMap();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastKeyRef.current === pinsKeyValue) return;
    lastKeyRef.current = pinsKeyValue;

    if (pinCount === 0) {
      map.setView(
        [MAP_CONFIG.exploreDefaultCenter.lat, MAP_CONFIG.exploreDefaultCenter.lng],
        MAP_CONFIG.exploreDefaultZoom,
        { animate: false }
      );
      return;
    }

    map.setView(
      [MAP_CONFIG.exploreDefaultCenter.lat, MAP_CONFIG.exploreDefaultCenter.lng],
      MAP_CONFIG.exploreDefaultZoom,
      { animate: false }
    );
  }, [map, pinsKeyValue, pinCount]);

  return null;
};

const FitMapBounds = ({
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

/** Desktop explore — Leaflet +/- (default control is off when map fills stage). */
const ExploreMapDesktopZoomControl = () => {
  const map = useMap();

  useEffect(() => {
    const control = L.control.zoom({ position: 'bottomright' });
    control.addTo(map);
    const container = control.getContainer();
    if (container) {
      container.classList.add('uaetrail-explore-desktop-zoom');
    }
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
};

const MapResize = ({ layoutRevision }: { layoutRevision?: number | string | boolean }) => {
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

const RecenterMap = ({
  target,
  zoom,
}: {
  target: { lat: number; lng: number } | null;
  zoom?: number;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    const targetZoom = zoom ?? Math.max(map.getZoom(), 13);
    map.flyTo([target.lat, target.lng], targetZoom, { duration: 0.55 });
  }, [map, target, zoom]);

  return null;
};

const MAP_BOUNDS_DEBOUNCE_MS = 400;

const MapVisibleBoundsReporter = ({
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

const MapZoomReporter = ({ onZoomChange }: { onZoomChange?: (zoom: number) => void }) => {
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

const FlyToSelectedPin = ({
  pins,
  selectedExploreItemId,
}: {
  pins: PlaceMapPin[];
  selectedExploreItemId?: string;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedExploreItemId) return;
    const related = pins.filter((entry) => pinMatchesSelection(entry, selectedExploreItemId));
    if (related.length === 0) return;

    if (related.length >= 2) {
      const bounds = L.latLngBounds(related.map((entry) => [entry.latitude, entry.longitude]));
      map.flyToBounds(bounds, { padding: [72, 72], maxZoom: 13, duration: 0.45 });
      return;
    }

    const pin = related[0];
    map.flyTo([pin.latitude, pin.longitude], Math.max(map.getZoom(), 13), { duration: 0.45 });
  }, [map, pins, selectedExploreItemId]);

  return null;
};

/** Imperative cluster layer — avoids react-leaflet-markercluster compatibility issues. */
const ClusteredMarkers = ({
  pins,
  selectedExploreItemId,
  highlightedExploreItemId,
  onPinClick,
}: {
  pins: PlaceMapPin[];
  selectedExploreItemId?: string;
  highlightedExploreItemId?: string;
  onPinClick?: (pin: PlaceMapPin) => void;
}) => {
  const map = useMap();
  const [mapZoom, setMapZoom] = useState(() => map.getZoom());
  const pinsKeyValue = useMemo(() => pinsKey(pins), [pins]);
  const onPinClickRef = useRef(onPinClick);

  useMapEvents({
    zoomend: () => setMapZoom(map.getZoom()),
    load: () => setMapZoom(map.getZoom()),
  });

  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  useEffect(() => {
    if (!map?.getContainer()) return;

    let group: L.MarkerClusterGroup | null = null;

    try {
      group = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        maxClusterRadius: 32,
        spiderfyOnMaxZoom: true,
        zoomToBoundsOnClick: false,
        disableClusteringAtZoom: 18,
        iconCreateFunction: (cluster) => {
          const clusterPins = pinsFromCluster(cluster);
          const entries = aggregateClusterPinEntries(
            clusterPins,
            selectedExploreItemId,
            highlightedExploreItemId
          );

          if (entries.length > 1) {
            const { html, size } = buildMapColocatedPinIconHtml(entries);
            return L.divIcon({
              html,
              className: 'uaetrail-map-cluster-wrap',
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
            });
          }

          const entry = entries[0]!;
          if (isCatalogVenueMapPin(entry.kind, entry.source)) {
            const layout = buildVenueMapPinHtml({
              kind: entry.kind,
              mapZoom,
              selected: entry.selected,
              stackCount: entry.stackCount,
            });
            return L.divIcon({
              html: layout.html,
              className: 'uaetrail-map-pin uaetrail-map-venue-pin-wrap',
              iconSize: [layout.width, layout.height],
              iconAnchor: layout.iconAnchor,
            });
          }
          const size = 48;
          return L.divIcon({
            html: buildMapClusterIconHtml(entry.kind, entry.source, entry.ringColor, entry.stackCount),
            className: 'uaetrail-map-cluster-wrap',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });

      group.on('clusterclick', (event) => {
        const cluster = event.layer;
        const clusterPins = pinsFromCluster(cluster);
        const resolved = resolveClusterMapClick(
          clusterPins,
          event,
          selectedExploreItemId,
          highlightedExploreItemId
        );
        if (resolved) {
          onPinClickRef.current?.(resolved);
          return;
        }
        cluster.zoomToBounds({ padding: [72, 72], maxZoom: 17 });
      });

      for (let index = 0; index < pins.length; index += 1) {
        const pin = pins[index]!;
        const marker = L.marker([pin.latitude, pin.longitude], {
          icon: pinIcon(
            pin.activityType,
            isPinEmphasized(pin, selectedExploreItemId, highlightedExploreItemId),
            pin,
            pin.rideshareEndpoint,
            selectedExploreItemId,
            mapZoom,
            highlightedExploreItemId
          ),
          zIndexOffset: markerZIndex(pin, selectedExploreItemId, highlightedExploreItemId) + index,
        }) as MarkerWithPin;
        marker.options.uaetrailPin = pin;
        marker.on('click', (event) => onPinClickRef.current?.(resolvePinClick(pin, event)));
        group.addLayer(marker);
      }

      map.addLayer(group);
    } catch (error) {
      console.error('[ClusteredMarkers] failed to mount cluster layer', error);
      return;
    }

    return () => {
      if (!group) return;
      try {
        group.clearLayers();
        if (map.hasLayer(group)) {
          map.removeLayer(group);
        }
      } catch {
        // Map may already be torn down during route changes / StrictMode.
      }
    };
  }, [map, pins, pinsKeyValue, selectedExploreItemId, highlightedExploreItemId, mapZoom]);

  return null;
};

interface PlacesMapProps {
  pins: PlaceMapPin[];
  bounds: MapBounds;
  className?: string;
  minHeight?: number;
  fill?: boolean;
  allowEmpty?: boolean;
  selectedPinId?: string;
  selectedExploreItemId?: string;
  /** List hover preview — same pin emphasis as selection, without fly-to. */
  highlightedExploreItemId?: string;
  onPinClick?: (pin: PlaceMapPin) => void;
  showLegend?: boolean;
  tileUrl?: string;
  labelTileUrl?: string | null;
  recenterTo?: { lat: number; lng: number } | null;
  exploreMode?: boolean;
  /** Overrides explore default center — device fix or regional UAE framing. */
  exploreMapCenter?: { lat: number; lng: number } | null;
  onZoomChange?: (zoom: number) => void;
  /** Debounced viewport bounds (explore map bbox fetch). */
  onVisibleBoundsChange?: (bounds: MapBounds) => void;
  tileAttribution?: string;
  minZoom?: number;
  showDesktopZoomControl?: boolean;
  /** Bumps Leaflet invalidateSize when mobile list sheet / layout chrome changes. */
  layoutRevision?: number | string | boolean;
}

/** Interactive map with location pins anchored to coordinates (Leaflet map tiles). */
export const PlacesMap = ({
  pins,
  bounds,
  className = '',
  minHeight = 420,
  fill = false,
  allowEmpty = false,
  selectedPinId,
  selectedExploreItemId,
  highlightedExploreItemId,
  onPinClick,
  showLegend = true,
  tileUrl,
  labelTileUrl,
  recenterTo = null,
  exploreMode = false,
  exploreMapCenter = null,
  onZoomChange,
  onVisibleBoundsChange,
  tileAttribution,
  minZoom,
  showDesktopZoomControl = false,
  layoutRevision,
}: PlacesMapProps) => {
  const mapBounds = useMemo(() => boundsFromPins(pins, bounds), [pins, bounds]);
  const pinsKeyValue = useMemo(() => pinsKey(pins), [pins]);
  const exploreCenter: [number, number] = exploreMapCenter
    ? [exploreMapCenter.lat, exploreMapCenter.lng]
    : [MAP_CONFIG.exploreDefaultCenter.lat, MAP_CONFIG.exploreDefaultCenter.lng];

  if (pins.length === 0 && !allowEmpty) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/50 text-sm text-neutral-600 ${className}`}
        style={{ minHeight }}
      >
        No locations with map coordinates match your filters.
      </div>
    );
  }

  const exploreFillMinPx = 280;
  const mapHeight = fill ? '100%' : minHeight;
  const resolvedFillMinHeight = fill ? Math.max(minHeight || 0, exploreFillMinPx) : minHeight;
  const activeSelection = selectedExploreItemId ?? selectedPinId;

  const renderMarker = (pin: PlaceMapPin) => (
    <Marker
      key={pin.id}
      position={[pin.latitude, pin.longitude]}
      icon={pinIcon(
        pin.activityType,
        isPinEmphasized(pin, activeSelection, highlightedExploreItemId),
        pin,
        pin.rideshareEndpoint,
        activeSelection,
        MAP_CONFIG.exploreDefaultZoom,
        highlightedExploreItemId
      )}
      zIndexOffset={markerZIndex(pin, activeSelection, highlightedExploreItemId)}
      eventHandlers={
        onPinClick
          ? {
              click: (event) => onPinClick(resolvePinClick(pin, event)),
            }
          : undefined
      }
    >
      {onPinClick ? null : (
        <Popup>
          <div className="min-w-[140px]">
            <p className="text-sm font-semibold text-neutral-900">{pin.name}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {pin.source === 'venue'
                ? `${formatActivityType(pin.activityType)} spot`
                : pin.activityType === 'shop'
                  ? 'Shop'
                  : formatActivityType(pin.activityType)}
            </p>
            <Link
              to={pin.path}
              className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View details
            </Link>
          </div>
        </Popup>
      )}
    </Marker>
  );

  const resolvedMinZoom = minZoom ?? (exploreMode ? MAP_CONFIG.exploreMinZoom : 9);

  return (
    <div
      className={`relative overflow-hidden bg-[#2a3441] ${exploreMode ? 'explore-map-rich ' : ''}${fill ? '' : 'rounded-2xl border border-emerald-100'} ${className}`}
      style={
        fill
          ? { height: '100%', minHeight: resolvedFillMinHeight }
          : { minHeight: resolvedFillMinHeight }
      }
    >
      <MapContainer
        center={exploreMode ? exploreCenter : [MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng]}
        zoom={exploreMode ? MAP_CONFIG.exploreDefaultZoom : MAP_CONFIG.defaultZoom}
        minZoom={resolvedMinZoom}
        maxZoom={18}
        scrollWheelZoom
        zoomControl={!fill}
        attributionControl={!fill}
        className="z-0 h-full w-full"
        style={{
          height: mapHeight,
          minHeight: fill ? resolvedFillMinHeight : mapHeight,
          width: '100%',
        }}
      >
        <MapTileLayers tileUrl={tileUrl} labelTileUrl={labelTileUrl} attribution={tileAttribution} maxZoom={18} />
        {exploreMode ? (
          <ExploreInitialView pinsKeyValue={pinsKeyValue} pinCount={pins.length} />
        ) : (
          <FitMapBounds mapBounds={mapBounds} maxZoom={14} pinCount={pins.length} pinsKeyValue={pinsKeyValue} />
        )}
        <MapResize layoutRevision={layoutRevision} />
        <RecenterMap
          target={recenterTo}
          zoom={exploreMode ? MAP_CONFIG.exploreDefaultZoom : undefined}
        />
        <MapZoomReporter onZoomChange={onZoomChange} />
        {onVisibleBoundsChange ? (
          <MapVisibleBoundsReporter onVisibleBoundsChange={onVisibleBoundsChange} />
        ) : null}
        <FlyToSelectedPin pins={pins} selectedExploreItemId={activeSelection} />
        {exploreMode && showDesktopZoomControl ? <ExploreMapDesktopZoomControl /> : null}
        {exploreMode ? (
          <ClusteredMarkers
            pins={pins}
            selectedExploreItemId={activeSelection}
            highlightedExploreItemId={highlightedExploreItemId}
            onPinClick={onPinClick}
          />
        ) : (
          pins.map(renderMarker)
        )}
      </MapContainer>
      {showLegend && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm">
            <span className="font-emoji">{MAP_FILTER_EMOJI.hiking}</span> Hikes
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
            <span className="font-emoji">{HIKING_VENUE_EMOJI}</span> Trails
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-700 shadow-sm">
            <span className="font-emoji">{CAMPING_ACTIVITY_EMOJI}</span> Camps
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-800 shadow-sm">
            <span className="font-emoji">{CAMPING_VENUE_EMOJI}</span> Camp spots
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-violet-700 shadow-sm">
            <span className="font-emoji">🏃</span> Events
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-700 shadow-sm">
            <span className="font-emoji">🛍️</span> Shops
          </span>
        </div>
      )}
    </div>
  );
};

/** @deprecated Use PlaceMapPin */
export type LocationMapPin = PlaceMapPin;
/** @deprecated Use PlacesMap */
export const LocationsMap = PlacesMap;
