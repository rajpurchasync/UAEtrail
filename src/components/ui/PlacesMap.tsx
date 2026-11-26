import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { formatActivityType } from '../../utils/activityIdentity';
import { MAP_CONFIG, type ExploreMapStyle } from '../../config/platform';
import type { MapRecenterTarget } from '../../lib/mapRecenter';
import { exploreMapPinRingColor, type MapPinRingSource } from '../../config/exploreTheme';
import {
  CAMPING_ACTIVITY_EMOJI,
  CAMPING_VENUE_EMOJI,
  HIKING_VENUE_EMOJI,
  MAP_FILTER_EMOJI,
} from '@/discovery/discoveryPortExploreMapPin';
import {
  buildActivityMapPinLayout,
  buildMapClusterIconHtml,
  buildMapCollidedPinIconHtml,
  buildVenueMapPinHtml,
  colocatedPinCanvasMetrics,
  isCatalogVenueMapPin,
  resolveClusterClickExploreItemId,
  resolveColocatedExploreItemIdFromPointer,
  type ColocatedPinIconEntry,
} from '@/discovery/discoveryPortExploreMapPin';
import {
  resolveMapPinActivityCaption,
  resolveMapPinPlaceCaption,
} from '@/discovery/discoveryPortExploreMapPin';
import { MapTileLayers } from './MapTileLayers';
import { mapTileLoadOptions } from './mapTileLoadOptions';
import {
  anyPinOutsideComfortableView,
  resolveSidecarSessionZoom,
  sidecarFocusCenter,
} from './placesMapSidecarViewport';
import {
  mapPinLeafletIconMetrics,
  panDeltaToShowPinWithPopup,
  panMapToLatLngBoundsAtCurrentZoom,
  wrapMapPinWithGeoAnchor,
} from './placesMapPinViewport';
import type {
  ColocatedMapPinEntry,
  MapBounds,
  MapPinKind,
  MapPinSource,
  PlaceMapPin,
} from './placesMapTypes';
export type { ColocatedMapPinEntry, MapBounds, MapPinKind, MapPinSource, PlaceMapPin };
import {
  EXPLORE_MAP_CLUSTER_DISABLE_AT_ZOOM,
  exploreMapClusterRadiusPx,
  exploreMapClusterSpiderPolylineOptions,
  scheduleExploreMapClusterSpiderExpand,
  syncExploreMapClusterSpiderCollapse,
} from '@/discovery/discoveryPortExploreMapCluster';
import {
  formatExploreMapClusterTooltipLabel,
  formatExploreMapPinTooltipLabel,
} from '@/discovery/discoveryPortExploreMapPin';

const toMapPinRingSource = (source: MapPinSource): MapPinRingSource | undefined => {
  if (source === 'availability') return 'availability';
  switch (source) {
    case 'activity':
      return 'activity';
    case 'venue':
      return 'venue';
    case 'shop':
      return 'shop';
    case 'agency':
      return 'agency';
    case 'destination':
      return 'venue';
    default:
      return undefined;
  }
};

const MAP_PIN_TOOLTIP_OPTIONS = {
  direction: 'top' as const,
  offset: [0, -14] as [number, number],
  className: 'uaetrail-map-pin-tooltip',
  opacity: 1,
  sticky: true,
};

const colocatedEntriesForTooltip = (
  pin: PlaceMapPin
): ColocatedPinIconEntry[] | null => {
  if (!pin.colocatedEntries?.length) return null;
  return pin.colocatedEntries.map((entry) => {
    const source = entry.source ?? 'activity';
    return {
      kind: entry.activityType,
      source,
      ringColor: exploreMapPinRingColor(
        entry.activityType,
        toMapPinRingSource(source)
      ),
      exploreItemId: entry.exploreItemId,
      stackCount: entry.stackCount ?? 1,
      activityMode: entry.activityMode ?? null,
    };
  });
};

const resolveExploreMapPinTooltipLabel = (pin: PlaceMapPin): string | null => {
  const colocated = colocatedEntriesForTooltip(pin);
  if (colocated?.length) return formatExploreMapClusterTooltipLabel(colocated);
  if ((pin.stackCount ?? 1) > 1) {
    return formatExploreMapClusterTooltipLabel([
      { kind: pin.activityType, stackCount: pin.stackCount ?? 1 },
    ]);
  }
  return formatExploreMapPinTooltipLabel(pin);
};

const attachExploreMapPinTooltip = (marker: L.Marker, pin: PlaceMapPin) => {
  const label = resolveExploreMapPinTooltipLabel(pin);
  if (!label) return;
  marker.bindTooltip(label, MAP_PIN_TOOLTIP_OPTIONS);
};

const attachExploreMapClusterTooltip = (
  cluster: L.MarkerCluster,
  clusterPins: PlaceMapPin[],
  entries: ColocatedPinIconEntry[]
) => {
  cluster.unbindTooltip();
  const totalStacked = entries.reduce((sum, entry) => sum + (entry.stackCount ?? 1), 0);
  const useBreakdown = clusterPins.length > 1 || entries.length > 1 || totalStacked > 1;
  if (useBreakdown) {
    const label = formatExploreMapClusterTooltipLabel(entries);
    if (label) cluster.bindTooltip(label, MAP_PIN_TOOLTIP_OPTIONS);
    return;
  }
  const pin = clusterPins[0];
  if (pin) attachExploreMapPinTooltip(cluster, pin);
};

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
  if (pin.id.startsWith('destination:')) return 'destination';
  if (pin.id.startsWith('venue:')) return 'venue';
  if (pin.id.startsWith('shop:')) return 'shop';
  if (pin.id.startsWith('agency:')) return 'agency';
  if (pin.source === 'catalog_place') return 'venue';
  if (
    pin.source === 'activity' ||
    isGeographyMapSource(pin.source) ||
    pin.source === 'shop' ||
    pin.source === 'agency'
  ) {
    return pin.source ?? 'activity';
  }
  return 'activity';
};

const leafDivIcon = (
  className: string,
  bodyHtml: string,
  bodyWidth: number,
  bodyHeight: number,
  anchorX?: number,
  options?: { hitPaddingPx?: number; useGeoAnchor?: boolean }
): L.DivIcon => {
  const useGeo = options?.useGeoAnchor !== false;
  const layout = useGeo
    ? wrapMapPinWithGeoAnchor(bodyHtml, bodyWidth, bodyHeight, anchorX)
    : {
        html: bodyHtml,
        width: bodyWidth,
        height: bodyHeight,
        iconAnchor: [anchorX ?? bodyWidth / 2, bodyHeight] as [number, number],
        bodyHeight,
      };
  const metrics = mapPinLeafletIconMetrics(layout, { hitPaddingPx: options?.hitPaddingPx });
  return L.divIcon({
    className,
    html: metrics.html,
    iconSize: metrics.iconSize,
    iconAnchor: metrics.iconAnchor,
    popupAnchor: [0, -layout.iconAnchor[1] - 4],
  });
};

const buildPlacesMapLabelPinLayout = (
  pin: Pick<
    PlaceMapPin,
    'id' | 'name' | 'source' | 'stackCount' | 'exploreItemId' | 'placeKind'
  >,
  kind: MapPinKind,
  source: MapPinSource,
  options: {
    selected: boolean;
    mapZoom: number;
    exploreMapStyle: ExploreMapStyle;
  }
) => {
  const ringSource = toMapPinRingSource(source);
  const ringColor = exploreMapPinRingColor(kind, ringSource);
  const caption = resolveMapPinPlaceCaption({
    kind,
    placeKind: pin.placeKind,
    source,
    venueName: pin.name,
    mapZoom: options.mapZoom,
    mapStyle: options.exploreMapStyle,
    selected: options.selected,
  });
  const size = options.selected ? 36 : 32;
  return buildActivityMapPinLayout({
    kind,
    source,
    ringColor,
    size,
    fontSizePx: 15,
    ringWidth: options.selected ? 3 : 2.5,
    selected: options.selected,
    stackCount: pin.stackCount ?? 1,
    placeKind: pin.placeKind,
    labelOnly: true,
    exploreItemId: pin.exploreItemId ?? pin.id,
    caption,
    hidePinIcon: true,
  });
};

const pinIcon = (
  kind: MapPinKind,
  selected: boolean,
  pin: Pick<
    PlaceMapPin,
    | 'id'
    | 'name'
    | 'source'
    | 'stackCount'
    | 'colocatedEntries'
    | 'activityMode'
    | 'placeKind'
    | 'exploreItemId'
    | 'scheduleDate'
    | 'hostedTripCount'
    | 'pinCoverImage'
  >,
  _rideshareEndpoint?: 'from' | 'to',
  selectedExploreItemId?: string,
  mapZoom: number = MAP_CONFIG.exploreDefaultZoom,
  highlightedExploreItemId?: string,
  useGeoAnchor = true,
  exploreMapStyle: ExploreMapStyle = 'satellite'
): L.DivIcon => {
  const pinLayout = { hitPaddingPx: 0 as const, useGeoAnchor };
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
          toMapPinRingSource(source)
        ),
        exploreItemId: entry.exploreItemId,
        stackCount: entry.stackCount ?? 1,
        selected: entrySelected,
        activityMode: entry.activityMode ?? null,
      };
    });
    const { html, size } = buildMapCollidedPinIconHtml(
      entries,
      entries.reduce((sum, entry) => sum + (entry.stackCount ?? 1), 0)
    );
    return leafDivIcon('uaetrail-map-pin', html, size, size, size / 2, pinLayout);
  }

  const source = resolvePinSource(pin);
  if (kind === 'destination') {
    const layout = buildPlacesMapLabelPinLayout(
      pin,
      'destination',
      source,
      { selected, mapZoom, exploreMapStyle }
    );
    return leafDivIcon(
      'uaetrail-map-pin uaetrail-map-venue-pin-wrap uaetrail-map-destination-pin-wrap',
      layout.html,
      layout.width,
      layout.height,
      layout.anchorX,
      pinLayout
    );
  }
  if (isGeographyMapSource(source) && kind !== 'shop' && kind !== 'agency') {
    const layout = buildPlacesMapLabelPinLayout(pin, kind, source, {
      selected,
      mapZoom,
      exploreMapStyle,
    });
    return leafDivIcon(
      'uaetrail-map-pin uaetrail-map-venue-pin-wrap',
      layout.html,
      layout.width,
      layout.height,
      layout.anchorX,
      pinLayout
    );
  }

  const ringSource: MapPinRingSource | undefined = toMapPinRingSource(source);
  const ringColor = exploreMapPinRingColor(kind, ringSource);
  const isVenue = isGeographyMapSource(source);
  const size = isVenue ? (selected ? 36 : 32) : selected ? 36 : 32;
  const iconSize = isVenue ? 15 : 18;
  const ringWidth = selected ? 3 : 2.5;
  const stackCount = pin.stackCount ?? 0;
  const caption = resolveMapPinActivityCaption({
    kind,
    scheduleDate: pin.scheduleDate,
    activityMode: pin.activityMode,
    source,
    mapZoom,
    mapStyle: exploreMapStyle,
    selected,
  });
  const layout = buildActivityMapPinLayout({
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
    labelOnly: !isVenue,
    exploreItemId: pin.exploreItemId ?? pin.id,
    caption,
  });

  return leafDivIcon('uaetrail-map-pin', layout.html, layout.width, layout.height, layout.anchorX, pinLayout);
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

const clusterPinForExploreItemId = (
  clusterPins: PlaceMapPin[],
  exploreItemId: string
): PlaceMapPin | null => {
  for (const pin of clusterPins) {
    if (pin.colocatedEntries?.length) {
      const entry = pin.colocatedEntries.find(
        (candidate) =>
          candidate.exploreItemId === exploreItemId ||
          candidate.stackExploreItemIds?.includes(exploreItemId)
      );
      if (entry) return pinForExploreItemClick(pin, exploreItemId);
    }
    if (
      pin.exploreItemId === exploreItemId ||
      pin.id === exploreItemId ||
      pin.stackExploreItemIds?.includes(exploreItemId)
    ) {
      return pin.exploreItemId === exploreItemId ? pin : pinForExploreItemClick(pin, exploreItemId);
    }
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
  const bodyHeight = colocatedPinCanvasMetrics(entries.length).canvas;
  return resolveColocatedExploreItemIdFromPointer(entries, x, y, rect.width, rect.height, bodyHeight);
};

const resolvePinClick = (pin: PlaceMapPin, event?: L.LeafletMouseEvent): PlaceMapPin => {
  const itemId = exploreItemIdFromMapPointer(pin, event);
  if (itemId && pin.colocatedEntries?.length) {
    return pinForExploreItemClick(pin, itemId);
  }
  return pin;
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
      ringColor: exploreMapPinRingColor(kind, toMapPinRingSource(source)),
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

const clusterCollidedLeafIcon = (
  entries: ColocatedPinIconEntry[],
  pinCount: number,
  mapZoom: number,
  useGeoAnchor = true
): L.DivIcon => {
  const pinLayout = { hitPaddingPx: 0 as const, useGeoAnchor };
  const emphasized = entries.some((entry) => entry.selected);
  const wrapClass = emphasized
    ? 'uaetrail-map-cluster-wrap uaetrail-map-cluster-wrap--emphasized'
    : 'uaetrail-map-cluster-wrap';

  if (entries.length === 1) {
    const entry = entries[0]!;
    if (isCatalogVenueMapPin(entry.kind, entry.source)) {
      const layout = buildVenueMapPinHtml({
        kind: entry.kind,
        mapZoom,
        selected: entry.selected,
        stackCount: pinCount,
      });
      return leafDivIcon(
        emphasized
          ? 'uaetrail-map-pin uaetrail-map-venue-pin-wrap uaetrail-map-cluster-wrap--emphasized'
          : 'uaetrail-map-pin uaetrail-map-venue-pin-wrap',
        layout.html,
        layout.width,
        layout.height,
        layout.iconAnchor[0],
        pinLayout
      );
    }
    const size = 48;
    return leafDivIcon(
      wrapClass,
      buildMapClusterIconHtml(
        entry.kind,
        entry.source,
        entry.ringColor,
        pinCount,
        entry.exploreItemId,
        Boolean(entry.selected)
      ),
      size,
      size,
      size / 2,
      pinLayout
    );
  }

  const { html, size } = buildMapCollidedPinIconHtml(entries, pinCount);
  return leafDivIcon(wrapClass, html, size, size, size / 2, pinLayout);
};

const ExploreInitialView = () => {
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

/** Lets explore chrome call zoomIn / zoomOut without a Leaflet control. */
const MapReadyBridge = ({ onReady }: { onReady?: (map: L.Map | null) => void }) => {
  const map = useMap();

  useEffect(() => {
    onReady?.(map);
    return () => onReady?.(null);
  }, [map, onReady]);

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

/** Explore map — tap empty map to dismiss the pin peek (markers keep their own handlers). */
const MapPeekDismissOnMapClick = ({ onDismiss }: { onDismiss?: () => void }) => {
  useMapEvents({
    click: () => {
      onDismiss?.();
    },
  });
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

const SelectedPinScreenReporter = ({
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
const SidecarSessionZoom = ({
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

/** List side map — fly at session zoom when hover or selection targets a pin outside the comfortable inset. */
const ListSidecarMapViewportSync = ({
  pins,
  highlightedExploreItemId,
  selectedExploreItemId,
  sessionZoomRef,
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

    const zoom = resolveSidecarSessionZoom(sessionZoomRef.current, map.getZoom());
    const related = pins.filter((entry) => pinMatchesSelection(entry, focusId));
    if (related.length === 0) return;
    const coords = related.map((entry) => ({ lat: entry.latitude, lng: entry.longitude }));
    if (!anyPinOutsideComfortableView(map, coords)) return;
    const target = sidecarFocusCenter(coords);
    map.flyTo([target.lat, target.lng], zoom, { duration: 0.4 });
  }, [map, pins, highlightedExploreItemId, selectedExploreItemId, sessionZoomRef]);

  return null;
};

const EXPLORE_DEVICE_LOCATION_ICON: L.DivIcon = L.divIcon({
  className: 'uaetrail-map-user-location',
  html: '<span class="uaetrail-map-user-location-dot" aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const ExploreDeviceLocationMarker = ({
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
const ExploreListHoverViewportSync = ({
  pins,
  highlightedExploreItemId,
}: {
  pins: PlaceMapPin[];
  highlightedExploreItemId?: string;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!highlightedExploreItemId) return;

    const related = pins.filter((entry) => pinMatchesSelection(entry, highlightedExploreItemId));
    if (related.length === 0) return;
    const coords = related.map((entry) => ({ lat: entry.latitude, lng: entry.longitude }));
    if (!anyPinOutsideComfortableView(map, coords)) return;
    const target = sidecarFocusCenter(coords);
    map.flyTo([target.lat, target.lng], map.getZoom(), { duration: 0.4 });
  }, [map, pins, highlightedExploreItemId]);

  return null;
};

/** Imperative cluster layer — avoids react-leaflet-markercluster compatibility issues. */
const ClusteredMarkers = ({
  pins,
  selectedExploreItemId,
  highlightedExploreItemId,
  onPinClick,
  exploreMapStyle = 'satellite',
}: {
  pins: PlaceMapPin[];
  selectedExploreItemId?: string;
  highlightedExploreItemId?: string;
  onPinClick?: (pin: PlaceMapPin) => void;
  exploreMapStyle?: ExploreMapStyle;
}) => {
  const map = useMap();
  const mapZoomRef = useRef(map.getZoom());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const pinsKeyValue = useMemo(() => pinsKey(pins), [pins]);
  const onPinClickRef = useRef(onPinClick);
  const selectedRef = useRef(selectedExploreItemId);
  const highlightedRef = useRef(highlightedExploreItemId);
  selectedRef.current = selectedExploreItemId;
  highlightedRef.current = highlightedExploreItemId;

  const refreshClusterPinEmphasis = useCallback(() => {
    const group = clusterGroupRef.current;
    if (!group) return;
    const activeSelected = selectedRef.current;
    const activeHighlighted = highlightedRef.current;
    let index = 0;
    group.eachLayer((layer) => {
      const marker = layer as MarkerWithPin;
      const pin = marker.options.uaetrailPin;
      if (!pin) return;
      marker.setIcon(
        pinIcon(
          pin.activityType,
          isPinEmphasized(pin, activeSelected, activeHighlighted),
          pin,
          pin.rideshareEndpoint,
          activeSelected,
          mapZoomRef.current,
          activeHighlighted,
          false,
          exploreMapStyle
        )
      );
      marker.setZIndexOffset(markerZIndex(pin, activeSelected, activeHighlighted) + index);
      index += 1;
    });
    group.refreshClusters();
  }, [exploreMapStyle]);

  useMapEvents({
    zoomend: () => {
      mapZoomRef.current = map.getZoom();
      refreshClusterPinEmphasis();
      clusterGroupRef.current?.refreshClusters();
    },
    load: () => {
      mapZoomRef.current = map.getZoom();
    },
  });

  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  useEffect(() => {
    refreshClusterPinEmphasis();
  }, [exploreMapStyle, highlightedExploreItemId, selectedExploreItemId, refreshClusterPinEmphasis]);

  useEffect(() => {
    if (!map?.getContainer()) return;
    mapZoomRef.current = map.getZoom();

    let group: L.MarkerClusterGroup | null = null;

    try {
      group = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        maxClusterRadius: exploreMapClusterRadiusPx,
        disableClusteringAtZoom: EXPLORE_MAP_CLUSTER_DISABLE_AT_ZOOM,
        spiderfyOnMaxZoom: false,
        spiderfyDistanceMultiplier: 1.6,
        spiderLegPolylineOptions: exploreMapClusterSpiderPolylineOptions(),
        zoomToBoundsOnClick: false,
        iconCreateFunction: (cluster) => {
          const clusterPins = pinsFromCluster(cluster);
          const entries = aggregateClusterPinEntries(
            clusterPins,
            selectedRef.current,
            highlightedRef.current
          );
          attachExploreMapClusterTooltip(cluster, clusterPins, entries);

          if (clusterPins.length > 1) {
            return clusterCollidedLeafIcon(entries, clusterPins.length, mapZoomRef.current, false);
          }

          const pin = clusterPins[0]!;
          return pinIcon(
            pin.activityType,
            isPinEmphasized(pin, selectedRef.current, highlightedRef.current),
            pin,
            pin.rideshareEndpoint,
            selectedRef.current,
            mapZoomRef.current,
            highlightedRef.current,
            false,
            exploreMapStyle
          );
        },
      });

      type SpiderClusterGroup = L.MarkerClusterGroup & {
        _spiderfied?: L.MarkerCluster | null;
        _unspiderfy?: (event?: L.LeafletEvent) => void;
      };
      const spiderGroup = group as SpiderClusterGroup;
      const unspiderfy = spiderGroup._unspiderfy?.bind(spiderGroup);
      if (unspiderfy) {
        spiderGroup._unspiderfy = (event) => {
          const expanded = spiderGroup._spiderfied;
          if (expanded) {
            syncExploreMapClusterSpiderCollapse(expanded.getAllChildMarkers());
          }
          unspiderfy(event);
        };
      }

      group.on('clusterclick', (event) => {
        L.DomEvent.stopPropagation(event);
        const cluster = event.layer as L.MarkerCluster;
        const clusterPins = pinsFromCluster(cluster);

        if (clusterPins.length > 1) {
          type SpiderifiedCluster = L.MarkerCluster & { _spiderfied?: boolean };
          const layer = cluster as SpiderifiedCluster;

          const panToRing = () => {
            const spiderMarkers = cluster.getAllChildMarkers() as L.Marker[];
            if (spiderMarkers.length === 0) return;
            const bounds = L.latLngBounds(spiderMarkers.map((marker) => marker.getLatLng()));
            panMapToLatLngBoundsAtCurrentZoom(map, bounds);
          };

          if (layer._spiderfied) {
            panToRing();
            return;
          }

          cluster.once('spiderfied', panToRing);
          const ringMarkers = cluster.getAllChildMarkers() as L.Marker[];
          cluster.spiderfy();
          scheduleExploreMapClusterSpiderExpand(ringMarkers);
          return;
        }

        const entries = aggregateClusterPinEntries(
          clusterPins,
          selectedRef.current,
          highlightedRef.current
        );
        const exploreItemId = resolveClusterClickExploreItemId(
          entries,
          (event as { originalEvent?: MouseEvent }).originalEvent
        );
        const pin =
          (exploreItemId ? clusterPinForExploreItemId(clusterPins, exploreItemId) : null) ??
          clusterPins[0];
        if (pin) onPinClickRef.current?.(pin);
      });

      for (let index = 0; index < pins.length; index += 1) {
        const pin = pins[index]!;
        const marker = L.marker([pin.latitude, pin.longitude], {
          icon: pinIcon(
            pin.activityType,
            isPinEmphasized(pin, selectedRef.current, highlightedRef.current),
            pin,
            pin.rideshareEndpoint,
            selectedRef.current,
            mapZoomRef.current,
            highlightedRef.current,
            false,
            exploreMapStyle
          ),
          zIndexOffset: markerZIndex(pin, selectedRef.current, highlightedRef.current) + index,
        }) as MarkerWithPin;
        marker.options.uaetrailPin = pin;
        marker.on('click', (event) => onPinClickRef.current?.(resolvePinClick(pin, event)));
        attachExploreMapPinTooltip(marker, pin);
        group.addLayer(marker);
      }

      map.addLayer(group);
      clusterGroupRef.current = group;
      refreshClusterPinEmphasis();
    } catch (error) {
      console.error('[ClusteredMarkers] failed to mount cluster layer', error);
      return;
    }

    return () => {
      clusterGroupRef.current = null;
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
  }, [map, pins, pinsKeyValue, refreshClusterPinEmphasis]);

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
  recenterTo?: MapRecenterTarget | null;
  exploreMode?: boolean;
  /** Overrides explore default center — device fix or regional UAE framing. */
  exploreMapCenter?: { lat: number; lng: number } | null;
  onZoomChange?: (zoom: number) => void;
  /** Debounced viewport bounds (explore map bbox fetch). */
  onVisibleBoundsChange?: (bounds: MapBounds) => void;
  tileAttribution?: string;
  minZoom?: number;
  onMapReady?: (map: L.Map | null) => void;
  /** Bumps Leaflet invalidateSize when mobile list sheet / layout chrome changes. */
  layoutRevision?: number | string | boolean;
  /** List / guest side map — pan at session zoom; no zoom bumps. */
  flyToHighlightedPin?: boolean;
  /** Map-container pixels of the selected pin — peek bubble origin. */
  onSelectedPinScreenPoint?: (point: { x: number; y: number } | null) => void;
  /** Shown after Locate me / allow location — blue dot at device coordinates. */
  deviceLocation?: { lat: number; lng: number } | null;
  /** When set, clicking the map canvas (not a pin) dismisses the open peek. */
  onDismissMapPeek?: () => void;
  exploreMapStyle?: ExploreMapStyle;
};

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
  onMapReady,
  layoutRevision,
  flyToHighlightedPin = false,
  onSelectedPinScreenPoint,
  deviceLocation = null,
  onDismissMapPeek,
  exploreMapStyle = 'satellite',
}: PlacesMapProps) => {
  const sidecarSessionZoomRef = useRef<number | null>(null);
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

  const renderMarker = (pin: PlaceMapPin) => {
    const tooltipLabel = resolveExploreMapPinTooltipLabel(pin);
    return (
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
        highlightedExploreItemId,
        !exploreMode
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
      {tooltipLabel ? (
        <Tooltip {...MAP_PIN_TOOLTIP_OPTIONS}>{tooltipLabel}</Tooltip>
      ) : null}
      {onPinClick ? null : (
        <Popup>
          <div className="min-w-[140px]">
            <p className="text-sm font-semibold text-neutral-900">{pin.name}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {isGeographyMapSource(pin.source)
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
  };

  const resolvedMinZoom = minZoom ?? (exploreMode ? MAP_CONFIG.exploreMinZoom : 9);
  const tileLoad = mapTileLoadOptions(exploreMode);

  const mapSurfaceClass = exploreMode
    ? `explore-map-rich${exploreMapStyle === 'map' ? ' explore-map-basemap-map' : ''}${
        activeSelection ? ' explore-map-peek-open' : ''
      } `
    : '';

  return (
    <div
      className={`relative overflow-hidden bg-[#2a3441] ${mapSurfaceClass}${fill ? '' : 'rounded-2xl border border-emerald-100'} ${className}`}
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
        fadeAnimation={!exploreMode}
        zoomControl={!fill}
        attributionControl={!fill}
        className="z-0 h-full w-full"
        style={{
          height: mapHeight,
          minHeight: fill ? resolvedFillMinHeight : mapHeight,
          width: '100%',
        }}
      >
        <MapTileLayers
          tileUrl={tileUrl}
          labelTileUrl={labelTileUrl}
          attribution={tileAttribution}
          maxZoom={18}
          detectRetina={tileLoad.detectRetina}
          keepBuffer={tileLoad.keepBuffer}
          updateWhenIdle={tileLoad.updateWhenIdle}
          deferLabels={tileLoad.deferLabels}
        />
        {exploreMode ? (
          <ExploreInitialView />
        ) : (
          <FitMapBounds mapBounds={mapBounds} maxZoom={14} pinCount={pins.length} pinsKeyValue={pinsKeyValue} />
        )}
        <MapResize layoutRevision={layoutRevision} />
        <RecenterMap target={recenterTo} />
        <MapZoomReporter onZoomChange={onZoomChange} />
        {onVisibleBoundsChange ? (
          <MapVisibleBoundsReporter onVisibleBoundsChange={onVisibleBoundsChange} />
        ) : null}
        {flyToHighlightedPin ? (
          <>
            <SidecarSessionZoom sessionZoomRef={sidecarSessionZoomRef} />
            <ListSidecarMapViewportSync
              pins={pins}
              highlightedExploreItemId={highlightedExploreItemId}
              selectedExploreItemId={activeSelection}
              sessionZoomRef={sidecarSessionZoomRef}
            />
          </>
        ) : (
          <>
            <FlyToSelectedPin pins={pins} selectedExploreItemId={activeSelection} />
            <ExploreListHoverViewportSync
              pins={pins}
              highlightedExploreItemId={highlightedExploreItemId}
            />
          </>
        )}
        {onSelectedPinScreenPoint ? (
          <SelectedPinScreenReporter
            pins={pins}
            selectedExploreItemId={activeSelection}
            onChange={onSelectedPinScreenPoint}
          />
        ) : null}
        {exploreMode && onMapReady ? <MapReadyBridge onReady={onMapReady} /> : null}
        {exploreMode && onDismissMapPeek ? (
          <MapPeekDismissOnMapClick onDismiss={onDismissMapPeek} />
        ) : null}
        {exploreMode ? (
          <ClusteredMarkers
            pins={pins}
            selectedExploreItemId={activeSelection}
            highlightedExploreItemId={highlightedExploreItemId}
            onPinClick={onPinClick}
            exploreMapStyle={exploreMapStyle}
          />
        ) : (
          pins.map(renderMarker)
        )}
        {exploreMode && deviceLocation ? (
          <ExploreDeviceLocationMarker location={deviceLocation} />
        ) : null}
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

