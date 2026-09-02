import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../../config/platform';

export interface LocationMapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  activityType: 'hiking' | 'camping' | 'community_activity';
  path: string;
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

const PIN_SVG = {
  hiking:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  camping:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21 14 3l10.5 18Z"/><path d="M7.5 21h13"/></svg>',
  community_activity:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.2 2.2 0 0 1 0-4.4H6"/><path d="M18 9h1.5a2.2 2.2 0 0 0 0-4.4H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
};

const pinIcons: Record<LocationMapPin['activityType'], L.DivIcon> = {
  hiking: L.divIcon({
    className: '',
    html: `<span style="display:flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:9999px;background:#059669;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.18);border:2px solid #fff;">${PIN_SVG.hiking}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  }),
  camping: L.divIcon({
    className: '',
    html: `<span style="display:flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:9999px;background:#f59e0b;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.18);border:2px solid #fff;">${PIN_SVG.camping}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  }),
  community_activity: L.divIcon({
    className: '',
    html: `<span style="display:flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:9999px;background:#7c3aed;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.18);border:2px solid #fff;">${PIN_SVG.community_activity}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  }),
};

const FitMapBounds = ({ mapBounds }: { mapBounds: MapBounds }) => {
  const map = useMap();
  const leafletBounds = useMemo(
    () => L.latLngBounds([mapBounds.south, mapBounds.west], [mapBounds.north, mapBounds.east]),
    [mapBounds]
  );

  useEffect(() => {
    map.fitBounds(leafletBounds, { padding: [32, 32], maxZoom: 14 });
  }, [map, leafletBounds]);

  return null;
};

const MapResize = () => {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => {
      map.invalidateSize();
    };

    invalidate();
    const timeout = window.setTimeout(invalidate, 150);
    window.addEventListener('resize', invalidate);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);

  return null;
};

interface LocationsMapProps {
  pins: LocationMapPin[];
  bounds: MapBounds;
  className?: string;
  minHeight?: number;
}

/** Interactive map with location pins anchored to coordinates (Leaflet + OSM). */
export const LocationsMap = ({ pins, bounds, className = '', minHeight = 420 }: LocationsMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const mapBounds = useMemo(() => boundsFromPins(pins, bounds), [pins, bounds]);
  const center = useMemo(
    (): [number, number] => [
      (mapBounds.south + mapBounds.north) / 2,
      (mapBounds.west + mapBounds.east) / 2,
    ],
    [mapBounds]
  );
  const mapKey = useMemo(() => pins.map((pin) => pin.id).join('|'), [pins]);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (pins.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/50 text-sm text-neutral-600 ${className}`}
        style={{ minHeight }}
      >
        No locations with map coordinates match your filters.
      </div>
    );
  }

  if (!mapReady) {
    return (
      <div
        className={`rounded-2xl border border-emerald-100 bg-emerald-50/50 animate-pulse ${className}`}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={`relative rounded-2xl border border-emerald-100 overflow-hidden bg-emerald-50 ${className}`}
      style={{ minHeight }}
    >
      <MapContainer
        key={mapKey}
        center={center}
        zoom={9}
        scrollWheelZoom
        className="z-0 h-full w-full"
        style={{ height: minHeight, minHeight }}
      >
        <TileLayer attribution={MAP_CONFIG.tileAttribution} url={MAP_CONFIG.tileUrl} />
        <FitMapBounds mapBounds={mapBounds} />
        <MapResize />
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={pinIcons[pin.activityType]}
          >
            <Popup>
              <div className="min-w-[140px]">
                <p className="text-sm font-semibold text-neutral-900">{pin.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500 capitalize">{pin.activityType}</p>
                <Link
                  to={pin.path}
                  className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-600" /> Hiking
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Camping
        </span>
      </div>
    </div>
  );
};
