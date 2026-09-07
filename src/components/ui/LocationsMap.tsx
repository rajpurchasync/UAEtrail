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
import { resolveMapPinEmoji } from '../../utils/mapPinEmoji';
import { MapTileLayers } from './MapTileLayers';

export type MapPinKind = 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'carpool';
export type MapPinSource = 'activity' | 'venue' | 'shop' | 'agency' | 'demand';

export interface LocationMapPin {
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

export const boundsFromPins = (pins: LocationMapPin[], fallback: MapBounds): MapBounds => {
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

const pinShadow = '0 4px 14px rgba(15,23,42,.18), 0 1px 3px rgba(15,23,42,.1)';

const pinIcon = (
  kind: MapPinKind,
  selected: boolean,
  source: MapPinSource = 'activity',
  carpoolEndpoint?: 'from' | 'to'
): L.DivIcon => {
  const emoji = resolveMapPinEmoji(kind, source, carpoolEndpoint);
  const isVenue = source === 'venue';
  const size = isVenue ? (selected ? 36 : 32) : selected ? 44 : 40;
  const fontSize = isVenue ? 17 : 21;
  const scale = selected ? 'transform:scale(1.08);' : '';
  const border = isVenue ? '2px solid #e5e7eb' : '2.5px solid #fff';

  return L.divIcon({
    className: 'uaetrail-map-pin',
    html: `<span style="position:relative;display:block;width:${size}px;height:${size}px;${scale}"><span class="font-emoji" style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;border-radius:9999px;background:#fff;font-size:${fontSize}px;line-height:1;box-shadow:${pinShadow};border:${border};">${emoji}</span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

const markerZIndex = (pin: LocationMapPin, selectedExploreItemId?: string): number => {
  const selected =
    pin.id === selectedExploreItemId ||
    (pin.exploreItemId != null && pin.exploreItemId === selectedExploreItemId);
  if (selected) return 1000;
  if (pin.source === 'activity') return 500;
  if (pin.source === 'shop' || pin.source === 'agency') return 250;
  return 0;
};

const isPinSelected = (pin: LocationMapPin, selectedExploreItemId?: string): boolean =>
  Boolean(
    selectedExploreItemId &&
      (pin.id === selectedExploreItemId || pin.exploreItemId === selectedExploreItemId)
  );

const pinsKey = (pins: LocationMapPin[]): string =>
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
  pins: LocationMapPin[];
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
  pins: LocationMapPin[];
  selectedExploreItemId?: string;
  onPinClick?: (pin: LocationMapPin) => void;
}) => {
  const map = useMap();
  const pinsKeyValue = useMemo(() => pinsKey(pins), [pins]);

  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 15,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count >= 10 ? 46 : count >= 4 ? 42 : 38;
        return L.divIcon({
          html: `<span class="uaetrail-map-cluster font-emoji" style="width:${size}px;height:${size}px;line-height:${size - 4}px;">${count}</span>`,
          className: 'uaetrail-map-cluster-wrap',
          iconSize: [size, size],
        });
      },
    });

    for (const pin of pins) {
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: pinIcon(
          pin.activityType,
          isPinSelected(pin, selectedExploreItemId),
          pin.source ?? 'activity',
          pin.carpoolEndpoint
        ),
        zIndexOffset: markerZIndex(pin, selectedExploreItemId),
      });
      if (onPinClick) {
        marker.on('click', () => onPinClick(pin));
      }
      group.addLayer(marker);
    }

    map.addLayer(group);

    return () => {
      map.removeLayer(group);
      group.clearLayers();
    };
  }, [map, pins, pinsKeyValue, selectedExploreItemId, onPinClick]);

  return null;
};

interface LocationsMapProps {
  pins: LocationMapPin[];
  bounds: MapBounds;
  className?: string;
  minHeight?: number;
  fill?: boolean;
  allowEmpty?: boolean;
  selectedPinId?: string;
  selectedExploreItemId?: string;
  onPinClick?: (pin: LocationMapPin) => void;
  showLegend?: boolean;
  tileUrl?: string;
  labelTileUrl?: string | null;
  recenterTo?: { lat: number; lng: number } | null;
  exploreMode?: boolean;
  onZoomChange?: (zoom: number) => void;
  tileAttribution?: string;
}

/** Interactive map with location pins anchored to coordinates (Leaflet + OSM/Esri). */
export const LocationsMap = ({
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
}: LocationsMapProps) => {
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

  const renderMarker = (pin: LocationMapPin) => (
    <Marker
      key={pin.id}
      position={[pin.latitude, pin.longitude]}
      icon={pinIcon(
        pin.activityType,
        isPinSelected(pin, activeSelection),
        pin.source ?? 'activity',
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

  return (
    <div
      className={`relative overflow-hidden bg-[#e8eef4] ${fill ? '' : 'rounded-2xl border border-emerald-100'} ${className}`}
      style={fill ? { height: '100%', minHeight: '100%' } : { minHeight }}
    >
      <MapContainer
        center={exploreMode ? exploreCenter : [MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng]}
        zoom={exploreMode ? MAP_CONFIG.exploreDefaultZoom : MAP_CONFIG.defaultZoom}
        minZoom={9}
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
            <span className="font-emoji">🥾</span> Hikes
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-700 shadow-sm">
            <span className="font-emoji">🏕️</span> Camps
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-violet-700 shadow-sm">
            <span className="font-emoji">🏃</span> Events
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
            <span className="font-emoji">⛰️</span> Spots
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-rose-700 shadow-sm">
            <span className="font-emoji">🛍️</span> Shops
          </span>
        </div>
      )}
    </div>
  );
};
