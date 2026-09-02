import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../../config/platform';
import { formatCoord, parseCoord } from '../../utils/coords';

const pickerIcon = L.divIcon({
  className: '',
  html: `<span style="display:flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9999px;background:#059669;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.2);border:2px solid #fff;font-size:16px;line-height:1;">📍</span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface MapLocationPickerProps {
  lat: string;
  lng: string;
  onLatChange: (value: string) => void;
  onLngChange: (value: string) => void;
  /** Center map here when no pin is set yet */
  centerLat?: number | null;
  centerLng?: number | null;
  minHeight?: number;
  className?: string;
}

const MapClickPin = ({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapCenterSync = ({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
};

const MapResize = () => {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    invalidate();
    const t = window.setTimeout(invalidate, 150);
    window.addEventListener('resize', invalidate);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
};

/** Interactive map — tap or drag the pin to set coordinates. */
export const MapLocationPicker = ({
  lat,
  lng,
  onLatChange,
  onLngChange,
  centerLat,
  centerLng,
  minHeight = 220,
  className = '',
}: MapLocationPickerProps) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  const pinLat = parseCoord(lat);
  const pinLng = parseCoord(lng);

  const defaultCenter = useMemo((): [number, number] => {
    if (pinLat != null && pinLng != null) return [pinLat, pinLng];
    if (centerLat != null && centerLng != null) return [centerLat, centerLng];
    return [MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng];
  }, [pinLat, pinLng, centerLat, centerLng]);

  const zoom = pinLat != null && pinLng != null ? 13 : centerLat != null ? 11 : 8;

  const setPin = (latitude: number, longitude: number) => {
    onLatChange(formatCoord(latitude));
    onLngChange(formatCoord(longitude));
  };

  if (!mapReady) {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-gray-100 animate-pulse ${className}`}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs text-gray-500">Tap the map to place a pin, or drag it to adjust.</p>
      <div
        className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100"
        style={{ minHeight }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={zoom}
          scrollWheelZoom
          attributionControl={false}
          className="z-0 h-full w-full"
          style={{ height: minHeight, minHeight }}
        >
          <TileLayer url={MAP_CONFIG.tileUrl} />
          <MapResize />
          <MapCenterSync center={defaultCenter} zoom={zoom} />
          <MapClickPin onPick={setPin} />
          {pinLat != null && pinLng != null && (
            <Marker
              position={[pinLat, pinLng]}
              icon={pickerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  setPin(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      {(pinLat != null && pinLng != null) && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${pinLat},${pinLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-xs font-medium text-emerald-700 hover:text-emerald-800"
        >
          Open pin in Google Maps →
        </a>
      )}
    </div>
  );
};
