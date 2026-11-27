import { isGeographyMapSource } from '@uaetrail/shared-types';
import L from 'leaflet';
import { MAP_CONFIG, type ExploreMapStyle } from '../../config/platform';
import { exploreMapPinRingColor, type MapPinRingSource } from '../../config/exploreTheme';
import {
  buildActivityMapPinLayout,
  buildMapClusterIconHtml,
  buildMapCollidedPinIconHtml,
  buildVenueMapPinHtml,
  colocatedPinCanvasMetrics,
  isCatalogVenueMapPin,
  resolveColocatedExploreItemIdFromPointer,
  type ColocatedPinIconEntry,
} from '@/discovery/discoveryPortExploreMapPin';
import {
  resolveMapPinActivityCaption,
  resolveMapPinPlaceCaption,
} from '@/discovery/discoveryPortExploreMapPin';
import {
  formatExploreMapClusterTooltipLabel,
  formatExploreMapPinTooltipLabel,
} from '@/discovery/discoveryPortExploreMapPin';
import { mapPinLeafletIconMetrics, wrapMapPinWithGeoAnchor } from './placesMapPinViewport';
import type { MapBounds, MapPinKind, MapPinSource, PlaceMapPin } from './placesMapTypes';

export const MAP_PIN_TOOLTIP_OPTIONS = {
  direction: 'top' as const,
  offset: [0, -14] as [number, number],
  className: 'uaetrail-map-pin-tooltip',
  opacity: 1,
  sticky: true,
};

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
    default:
      return undefined;
  }
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

export const resolveExploreMapPinTooltipLabel = (pin: PlaceMapPin): string | null => {
  const colocated = colocatedEntriesForTooltip(pin);
  if (colocated?.length) return formatExploreMapClusterTooltipLabel(colocated);
  if ((pin.stackCount ?? 1) > 1) {
    return formatExploreMapClusterTooltipLabel([
      { kind: pin.activityType, stackCount: pin.stackCount ?? 1 },
    ]);
  }
  return formatExploreMapPinTooltipLabel(pin);
};

export const attachExploreMapPinTooltip = (marker: L.Marker, pin: PlaceMapPin) => {
  const label = resolveExploreMapPinTooltipLabel(pin);
  if (!label) return;
  marker.bindTooltip(label, MAP_PIN_TOOLTIP_OPTIONS);
};

export const attachExploreMapClusterTooltip = (
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

export const boundsFromPins = (pins: PlaceMapPin[], fallback: MapBounds): MapBounds => {
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
  if (pin.id.startsWith('destination:')) return 'place';
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

export const pinIcon = (
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

export type MarkerWithPin = L.Marker & { options: L.MarkerOptions & { uaetrailPin?: PlaceMapPin } };

export const pinsFromCluster = (cluster: L.MarkerCluster): PlaceMapPin[] => {
  const childMarkers = cluster.getAllChildMarkers() as MarkerWithPin[];
  const collected: PlaceMapPin[] = [];
  for (const marker of childMarkers) {
    const pin = marker.options.uaetrailPin;
    if (pin) collected.push(pin);
  }
  return collected;
};

export const pinMatchesSelection = (pin: PlaceMapPin, selectedExploreItemId?: string): boolean => {
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

export const pinForExploreItemClick = (pin: PlaceMapPin, exploreItemId: string): PlaceMapPin => ({
  ...pin,
  exploreItemId,
  stackExploreItemIds:
    pin.colocatedEntries?.find(
      (entry) =>
        entry.exploreItemId === exploreItemId || entry.stackExploreItemIds?.includes(exploreItemId)
    )?.stackExploreItemIds ?? pin.stackExploreItemIds,
});

export const clusterPinForExploreItemId = (
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

export const resolvePinClick = (pin: PlaceMapPin, event?: L.LeafletMouseEvent): PlaceMapPin => {
  const itemId = exploreItemIdFromMapPointer(pin, event);
  if (itemId && pin.colocatedEntries?.length) {
    return pinForExploreItemClick(pin, itemId);
  }
  return pin;
};

export const markerZIndex = (
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

export const isPinEmphasized = (
  pin: PlaceMapPin,
  selectedExploreItemId?: string,
  highlightedExploreItemId?: string
): boolean =>
  pinMatchesSelection(pin, selectedExploreItemId) ||
  (highlightedExploreItemId != null && pinMatchesSelection(pin, highlightedExploreItemId));

/** Sum indicative counts per map icon (type + source) for cluster / badge rendering. */
export const aggregateClusterPinEntries = (
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

export const pinsKey = (pins: PlaceMapPin[]): string =>
  pins
    .map((pin) => pin.id)
    .sort()
    .join('|');

export const clusterCollidedLeafIcon = (
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