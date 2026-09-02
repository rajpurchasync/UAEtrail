import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../../config/platform';
import { MapLocationPicker } from './MapLocationPicker';
import { parseCoord } from '../../utils/coords';

const previewIcon = L.divIcon({
  className: '',
  html: `<span style="display:flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9999px;background:#059669;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.2);border:2px solid #fff;font-size:16px;line-height:1;">📍</span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

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

interface MeetingPointMapProps {
  lat?: number | null;
  lng?: number | null;
  label?: string | null;
  hideExternalLink?: boolean;
}

/** Lightweight map preview + external maps link for meeting points. */
export const MeetingPointMap = ({ lat, lng, hideExternalLink = false }: MeetingPointMapProps) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (lat == null || lng == null) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-xl overflow-hidden border border-gray-200 aspect-[16/10] bg-gray-100">
        {mapReady ? (
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            scrollWheelZoom={false}
            dragging
            attributionControl={false}
            className="z-0 h-full w-full"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url={MAP_CONFIG.tileUrl} />
            <MapResize />
            <Marker position={[lat, lng]} icon={previewIcon} />
          </MapContainer>
        ) : (
          <div className="h-full w-full animate-pulse bg-gray-100" aria-hidden />
        )}
      </div>
      {!hideExternalLink && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          Open in Google Maps →
        </a>
      )}
    </div>
  );
};

interface MapPinFieldsProps {
  lat: string;
  lng: string;
  onLatChange: (value: string) => void;
  onLngChange: (value: string) => void;
  centerLat?: number | null;
  centerLng?: number | null;
}

export const MapPinFields = ({
  lat,
  lng,
  onLatChange,
  onLngChange,
  centerLat,
  centerLng,
}: MapPinFieldsProps) => (
  <div className="space-y-3">
    <MapLocationPicker
      lat={lat}
      lng={lng}
      onLatChange={onLatChange}
      onLngChange={onLngChange}
      centerLat={centerLat}
      centerLng={centerLng}
    />
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Latitude</label>
        <input
          type="number"
          step="any"
          min={-90}
          max={90}
          value={lat}
          onChange={(e) => onLatChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. 25.0657"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Longitude</label>
        <input
          type="number"
          step="any"
          min={-180}
          max={180}
          value={lng}
          onChange={(e) => onLngChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. 56.1221"
        />
      </div>
    </div>
  </div>
);

export { parseCoord };
