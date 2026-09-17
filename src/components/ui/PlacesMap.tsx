import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { formatActivityType } from '../../utils/activityIdentity';
import { MAP_CONFIG } from '../../config/platform';
import { exploreMapPinRingColor } from '../../config/exploreTheme';
import { HIKING_VENUE_EMOJI, CAMPING_VENUE_EMOJI, CAMPING_ACTIVITY_EMOJI, MAP_FILTER_EMOJI } from '../../explore/exploreCopy';
import { resolveMapPinIconSvg } from '../../explore/mapPinIcons';
import { MapTileLayers } from './MapTileLayers';
import type { MapPinKind, MapPinSource } from './mapPinTypes';

export type { MapPinKind, MapPinSource };

export interface PlaceMapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  activityType: MapPinKind;
  path: string;
  hostAvatar?: string | null;
  source?: MapPinSource;
  /** Base explore item id when this pin is a carpool endpoint. */
  exploreItemId?: string;
  carpoolEndpoint?: 'from' | 'to';
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
  if (
    pin.source === 'activity' ||
    pin.source === 'venue' ||
    pin.source === 'shop' ||
    pin.source === 'agency' ||
    pin.source === 'demand'
  ) {
    return pin.source;
  }
  if (pin.id.startsWith('venue:')) return 'venue';
  if (pin.id.startsWith('demand:')) return 'demand';
  if (pin.id.startsWith('shop:')) return 'shop';
  if (pin.id.startsWith('agency:')) return 'agency';
  return 'activity';
};

const pinIcon = (
  kind: MapPinKind,
  selected: boolean,
  pin: Pick<PlaceMapPin, 'id' | 'source'>,
  _carpoolEndpoint?: 'from' | 'to'
): L.DivIcon => {
  const source = resolvePinSource(pin);
  const ringColor = exploreMapPinRingColor(kind, source);
  const isVenue = source === 'venue';
  const size = isVenue ? (selected ? 36 : 32) : selected ? 44 : 40;
  const iconSize = isVenue ? 15 : 18;
  const ringWidth = selected ? 3 : 2.5;
  const selectedClass = selected ? ' uaetrail-map-pin-marker--selected' : '';
  const iconSvg = resolveMapPinIconSvg(kind, source, ringColor, iconSize);

  return L.divIcon({
    className: 'uaetrail-map-pin',
    html: `<span class="uaetrail-map-pin-marker${selectedClass}" style="--pin-ring:${ringColor};width:${size}px;height:${size}px;"><span class="uaetrail-map-pin-face" style="border:${ringWidth}px solid ${ringColor};"><span class="uaetrail-map-pin-icon">${iconSvg}</span></span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

const markerZIndex = (pin: PlaceMapPin, selectedExploreItemId?: string): number => {
  const selected =
    pin.id === selectedExploreItemId ||
    (pin.exploreItemId != null && pin.exploreItemId === selectedExploreItemId);
  if (selected) return 1000;
  if (pin.source === 'activity') return 500;
  if (pin.source === 'shop' || pin.source === 'agency') return 250;
  return 0;
};

const isPinSelected = (pin: PlaceMapPin, selectedExploreItemId?: string): boolean =>
  Boolean(
    selectedExploreItemId &&
      (pin.id === selectedExploreItemId || pin.exploreItemId === selectedExploreItemId)
  );

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

const MapResize = () => {
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
  }, [map]);

  return null;
};

const RecenterMap = ({ target }: { target: { lat: number; lng: number } | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 13), { duration: 0.55 });
  }, [map, target]);

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
    const related = pins.filter(
      (entry) =>
        entry.id === selectedExploreItemId || entry.exploreItemId === selectedExploreItemId
    );
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
  onPinClick,
}: {
  pins: PlaceMapPin[];
  selectedExploreItemId?: string;
  onPinClick?: (pin: PlaceMapPin) => void;
}) => {
  const map = useMap();
  const pinsKeyValue = useMemo(() => pinsKey(pins), [pins]);
  const onPinClickRef = useRef(onPinClick);

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
        maxClusterRadius: 48,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 15,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          const size = count >= 10 ? 46 : count >= 4 ? 42 : 38;
          return L.divIcon({
            html: `<span class="uaetrail-map-cluster" style="width:${size}px;height:${size}px;">${count}</span>`,
            className: 'uaetrail-map-cluster-wrap',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });

      for (const pin of pins) {
        const marker = L.marker([pin.latitude, pin.longitude], {
          icon: pinIcon(
            pin.activityType,
            isPinSelected(pin, selectedExploreItemId),
            pin,
            pin.carpoolEndpoint
          ),
          zIndexOffset: markerZIndex(pin, selectedExploreItemId),
        });
        marker.on('click', () => onPinClickRef.current?.(pin));
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
  }, [map, pins, pinsKeyValue, selectedExploreItemId]);

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
  onPinClick?: (pin: PlaceMapPin) => void;
  showLegend?: boolean;
  tileUrl?: string;
  labelTileUrl?: string | null;
  recenterTo?: { lat: number; lng: number } | null;
  exploreMode?: boolean;
  onZoomChange?: (zoom: number) => void;
  tileAttribution?: string;
  minZoom?: number;
}

/** Interactive map with location pins anchored to coordinates (Leaflet + OSM/Esri). */
export const PlacesMap = ({
  pins,
  bounds,
  className = '',
  minHeight = 420,
  fill = false,
  allowEmpty = false,
  selectedPinId,
  selectedExploreItemId,
  onPinClick,
  showLegend = true,
  tileUrl,
  labelTileUrl,
  recenterTo = null,
  exploreMode = false,
  onZoomChange,
  tileAttribution,
  minZoom,
}: PlacesMapProps) => {
  const mapBounds = useMemo(() => boundsFromPins(pins, bounds), [pins, bounds]);
  const pinsKeyValue = useMemo(() => pinsKey(pins), [pins]);
  const exploreCenter: [number, number] = [
    MAP_CONFIG.exploreDefaultCenter.lat,
    MAP_CONFIG.exploreDefaultCenter.lng,
  ];

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

  const mapHeight = fill ? '100%' : minHeight;
  const activeSelection = selectedExploreItemId ?? selectedPinId;

  const renderMarker = (pin: PlaceMapPin) => (
    <Marker
      key={pin.id}
      position={[pin.latitude, pin.longitude]}
      icon={pinIcon(
        pin.activityType,
        isPinSelected(pin, activeSelection),
        pin,
        pin.carpoolEndpoint
      )}
      zIndexOffset={markerZIndex(pin, activeSelection)}
      eventHandlers={
        onPinClick
          ? {
              click: () => onPinClick(pin),
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
      style={fill ? { height: '100%', minHeight: '100%' } : { minHeight }}
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
        style={{ height: mapHeight, minHeight: mapHeight, width: '100%' }}
      >
        <MapTileLayers tileUrl={tileUrl} labelTileUrl={labelTileUrl} attribution={tileAttribution} maxZoom={18} />
        {exploreMode ? (
          <ExploreInitialView pinsKeyValue={pinsKeyValue} pinCount={pins.length} />
        ) : (
          <FitMapBounds mapBounds={mapBounds} maxZoom={14} pinCount={pins.length} pinsKeyValue={pinsKeyValue} />
        )}
        <MapResize />
        <RecenterMap target={recenterTo} />
        <MapZoomReporter onZoomChange={onZoomChange} />
        <FlyToSelectedPin pins={pins} selectedExploreItemId={activeSelection} />
        {exploreMode ? (
          <ClusteredMarkers pins={pins} selectedExploreItemId={activeSelection} onPinClick={onPinClick} />
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
