import { useCallback, useEffect, useState } from 'react';
import { Circle, MapContainer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, MapPin, Navigation, X } from 'lucide-react';
import { MAP_CONFIG } from '../../config/platform';
import { MapTileLayers } from '../ui/MapTileLayers';
import type { LocationPrecision } from './mobileCreateFlow';

const MapFlyTo = ({ center, zoom }: { center: [number, number] | null; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
};
const MapResize = () => {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    invalidate();
    const timer = window.setTimeout(invalidate, 150);
    window.addEventListener('resize', invalidate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
};

const MapCenterTracker = ({
  onCenterChange,
}: {
  onCenterChange: (lat: number, lng: number) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    const update = () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    };
    update();
    map.on('moveend', update);
    return () => {
      map.off('moveend', update);
    };
  }, [map, onCenterChange]);

  return null;
};

const MapLocate = ({
  onLocated,
}: {
  onLocated: (lat: number, lng: number) => void;
}) => {
  const map = useMap();
  useMapEvents({
    locationfound(event) {
      onLocated(event.latlng.lat, event.latlng.lng);
      map.setView(event.latlng, 14, { animate: true });
    },
  });
  return null;
};

interface MobileCreateLocationPickerProps {
  precision: LocationPrecision;
  latitude: number;
  longitude: number;
  onPrecisionChange: (precision: LocationPrecision) => void;
  onLocationChange: (lat: number, lng: number) => void;
  onBack: () => void;
  onClose: () => void;
  onConfirm: () => void;
  headerTitle?: string;
  confirmLabel?: string;
  /** Initial map zoom — 15+ for street-level pin placement. */
  initialZoom?: number;
}

export const MobileCreateLocationPicker = ({
  precision,
  latitude,
  longitude,
  onPrecisionChange,
  onLocationChange,
  onBack,
  onClose,
  onConfirm,
  headerTitle = 'Drop your pin',
  confirmLabel = 'Confirm location',
  initialZoom = 15,
}: MobileCreateLocationPickerProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  useEffect(() => {
    setMapReady(true);
  }, []);

  const handleCenterChange = useCallback(
    (lat: number, lng: number) => {
      onLocationChange(lat, lng);
    },
    [onLocationChange]
  );

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: [number, number] = [position.coords.latitude, position.coords.longitude];
        onLocationChange(next[0], next[1]);
        setFlyTo(next);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const generalRadiusMeters = 1200;

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-200">
      {mapReady ? (
        <MapContainer
          center={[latitude, longitude]}
          zoom={initialZoom}
          minZoom={10}
          maxZoom={19}
          className="absolute inset-0 z-0 h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <MapTileLayers
            tileUrl={MAP_CONFIG.exploreTileUrl}
            labelTileUrl={MAP_CONFIG.exploreLabelTileUrl ?? MAP_CONFIG.labelTileUrl}
            attribution={MAP_CONFIG.exploreTileAttribution}
            maxZoom={19}
          />
          <MapFlyTo center={flyTo} zoom={Math.max(initialZoom, 16)} />
          <MapResize />
          <MapCenterTracker onCenterChange={handleCenterChange} />
          <MapLocate onLocated={onLocationChange} />
          {precision === 'general' && (
            <Circle
              center={[latitude, longitude]}
              radius={generalRadiusMeters}
              pathOptions={{
                color: '#f43f5e',
                fillColor: '#fb7185',
                fillOpacity: 0.18,
                weight: 2,
              }}
            />
          )}
        </MapContainer>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-emerald-50" />
      )}

      <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
        <div className="relative -mt-8">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-rose-500 text-white shadow-xl"
            aria-hidden
          >
            <MapPin className="h-5 w-5" />
          </span>
          <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 rounded-full bg-rose-500/80" />
        </div>
      </div>

      <header className="absolute inset-x-0 top-0 z-[600] px-4 pt-safe-plus-2">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-0.5 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-gray-800 shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex rounded-full bg-white/95 p-1 shadow-md">
            {(['general', 'specific'] as LocationPrecision[]).map((mode) => {
              const active = precision === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onPrecisionChange(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                    active ? 'bg-rose-500 text-white' : 'text-gray-600'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto mt-4 max-w-sm rounded-2xl bg-white/95 px-4 py-3 text-center shadow-lg">
          <p className="text-sm font-bold text-gray-900">{headerTitle}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {precision === 'general'
              ? "If you're not sure about the exact location"
              : 'Pinch or drag to zoom — place the pin on your storefront'}
          </p>
        </div>
      </header>

      <div className="absolute bottom-[calc(var(--safe-bottom)+16px)] left-4 right-4 z-[600] flex items-end justify-between gap-3">
        <button
          type="button"
          onClick={handleLocate}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg"
          aria-label="My location"
        >
          <Navigation className={`h-5 w-5 text-gray-800 ${locating ? 'animate-pulse' : ''}`} />
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-2xl bg-rose-500 py-4 text-center text-base font-bold text-white shadow-lg shadow-rose-500/30"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};
