import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { JourneyPinStyle } from '../../member-plan/journeyMapPinStyle';
import { journeyMapPendingPinIcon, journeyMapPinDivIcon } from '../../member-plan/journeyMapPinIcon';
import { MapTileLayers } from '../ui/MapTileLayers';

export type JourneyMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  pinStyle: JourneyPinStyle;
};

const MapResize = () => {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    invalidate();
    const t = window.setTimeout(invalidate, 150);
    const t2 = window.setTimeout(invalidate, 400);
    window.addEventListener('resize', invalidate);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
};

const FitBounds = ({
  markers,
  enabled,
}: {
  markers: JourneyMapMarker[];
  enabled: boolean;
}) => {
  const map = useMap();
  useEffect(() => {
    if (!enabled || markers.length === 0) return;
    const bounds = L.latLngBounds(
      markers.map((p) => [p.latitude, p.longitude] as [number, number])
    );
    map.fitBounds(bounds.pad(0.2), { animate: true, maxZoom: markers.length === 1 ? 12 : 8 });
  }, [map, markers, enabled]);
  return null;
};

const FlyToTarget = ({
  target,
  zoom,
}: {
  target: { lat: number; lng: number } | null;
  zoom: number;
}) => {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], zoom, { duration: 0.6 });
  }, [map, target, zoom]);
  return null;
};

const PickModeZoom = ({ active }: { active: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    const center = map.getCenter();
    const zoom = Math.max(map.getZoom(), 9);
    map.flyTo(center, zoom, { duration: 0.5 });
  }, [map, active]);
  return null;
};

const MapTapPick = ({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface JourneyMapProps {
  markers: JourneyMapMarker[];
  pendingLatLng: { lat: number; lng: number } | null;
  focusLatLng: { lat: number; lng: number } | null;
  onMapPick: (lat: number, lng: number) => void;
  onMarkerTap: (markerId: string) => void;
  pickMode: boolean;
  className?: string;
}

export const JourneyMap = ({
  markers,
  pendingLatLng,
  focusLatLng,
  onMapPick,
  onMarkerTap,
  pickMode,
  className = '',
}: JourneyMapProps) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMapReady(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  const initialCenter = useMemo((): [number, number] => {
    if (markers.length > 0) return [markers[0].latitude, markers[0].longitude];
    return [24, 12];
  }, [markers]);

  const initialZoom = markers.length > 0 ? 4 : 2;

  if (!mapReady) {
    return <div className={`animate-pulse bg-neutral-200 ${className}`} aria-hidden />;
  }

  return (
    <div className={`relative z-0 h-full w-full ${className}`}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom
        className="z-0 h-full w-full"
        style={{ height: '100%', width: '100%', minHeight: 200 }}
        zoomControl
        attributionControl={false}
      >
        <MapTileLayers />
        <MapResize />
        <FitBounds markers={markers} enabled={!pickMode && !pendingLatLng && !focusLatLng} />
        <PickModeZoom active={pickMode && !pendingLatLng} />
        <FlyToTarget target={pendingLatLng ?? focusLatLng} zoom={14} />
        <MapTapPick enabled={pickMode} onPick={onMapPick} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={journeyMapPinDivIcon(marker.pinStyle)}
            eventHandlers={{ click: () => onMarkerTap(marker.id) }}
          />
        ))}
        {pendingLatLng ? (
          <Marker position={[pendingLatLng.lat, pendingLatLng.lng]} icon={journeyMapPendingPinIcon()} />
        ) : null}
      </MapContainer>
      {pickMode ? (
        <div
          className="pointer-events-none absolute inset-x-3 top-3 z-[500] rounded-xl bg-white/95 px-3 py-2 text-center text-xs font-medium text-indigo-800 shadow-md"
          role="status"
        >
          Pinch to zoom anywhere in the world, then tap your spot.
        </div>
      ) : null}
    </div>
  );
};
